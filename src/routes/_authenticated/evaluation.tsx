import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  GraduationCap,
  Sparkles,
  Loader2,
  ClipboardList,
  Rocket,
  Trophy,
  CheckCircle2,
  XCircle,
  Trash2,
  Link as LinkIcon,
  Video,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateDailyQuizAI,
  generateAssignmentAI,
  evaluateSubmissionAI,
} from "@/lib/evaluation.functions";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

export const Route = createFileRoute("/_authenticated/evaluation")({
  component: EvaluationPage,
});

type Eval = {
  user_id?: string;
  id: string;
  kind: "quiz" | "assignment" | "project";
  title: string;
  milestone_title: string | null;
  milestone_id: string | null;
  content: any;
  submission: any;
  score: number | null;
  max_score: number;
  points_awarded: number;
  feedback: any;
  status: "pending" | "submitted" | "evaluated";
  created_at: string;
};

function EvaluationPage() {
  const qc = useQueryClient();
  const quizFn = useServerFn(generateDailyQuizAI);
  const asgFn = useServerFn(generateAssignmentAI);
  const evalFn = useServerFn(evaluateSubmissionAI);

  const [tab, setTab] = useState<"active" | "history">("active");
  const [milestone, setMilestone] = useState<string>("");

  const { data: evals = [] } = useQuery<Eval[]>({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, "evaluations"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs as any;
    },
  });

  const { data: roadmap } = useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const q = query(collection(db, "roadmaps"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docs = snap.docs.map((d) => d.data());
      docs.sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs[0];
    },
  });

  const milestones: any[] = (roadmap?.milestones as any) ?? [];
  const selected = milestones.find((m) => m.id === milestone);

  const refresh = () => qc.invalidateQueries({ queryKey: ["evaluations"] });

  const getContext = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");
    const qDna = query(collection(db, "growth_dna"), where("user_id", "==", user.uid));
    const dnaSnap = await getDocs(qDna);
    const dna = !dnaSnap.empty ? dnaSnap.docs[0].data() : null;
    const qProfile = query(collection(db, "profiles"), where("id", "==", user.uid));
    const profileSnap = await getDocs(qProfile);
    const profile = !profileSnap.empty ? profileSnap.docs[0].data() : null;
    return { user, dna, profile };
  };

  const quizM = useMutation({
    mutationFn: async () => {
      const { user, dna, profile } = await getContext();
      const topic = selected?.title ?? profile?.current_focus ?? "general growth";
      const parsed = await quizFn({ data: { profile, dna, topic, skills: selected?.skills } });

      await addDoc(collection(db, "evaluations"), {
        user_id: user.uid,
        kind: "quiz",
        milestone_id: milestone || null,
        milestone_title: selected?.title || null,
        title: parsed?.title ?? `Daily Quiz — ${topic}`,
        content: parsed,
        max_score: 100,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Quiz ready! ✨");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const asgM = useMutation({
    mutationFn: async () => {
      const { user, dna, profile } = await getContext();
      const topic = selected?.title ?? profile?.current_focus ?? "growth";
      const parsed = await asgFn({ data: { profile, dna, topic, skills: selected?.skills } });

      await addDoc(collection(db, "evaluations"), {
        user_id: user.uid,
        kind: "assignment",
        milestone_id: milestone || null,
        milestone_title: selected?.title || null,
        title: parsed?.title ?? `Assignment — ${topic}`,
        content: parsed,
        max_score: 100,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Assignment ready! ✨");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const projM = useMutation({
    mutationFn: async ({ projectTitle }: { projectTitle: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      await addDoc(collection(db, "evaluations"), {
        user_id: user.uid,
        kind: "project",
        milestone_id: milestone || null,
        milestone_title: selected?.title || null,
        title: projectTitle,
        content: {
          project: selected?.project ?? { title: projectTitle },
          instructions:
            "Submit your project link (GitHub, Drive, YouTube demo, live URL). Add a short description of what you built. RaahAI will evaluate it.",
        },
        max_score: 200,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Project slot ready! ✨");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "evaluations", id));
    },
    onSuccess: () => refresh(),
  });

  const active = evals.filter((e) => e.status !== "evaluated");
  const done = evals.filter((e) => e.status === "evaluated");

  const totalPoints = done.reduce((a, b) => a + (b.points_awarded ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        icon={GraduationCap}
        accent="Evaluation Center"
        title="Learn. Prove. Level up."
        description="Daily quizzes, assignments, and project submissions — RaahAI will honestly evaluate you and award points."
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={Brain}
          label="Quizzes"
          value={done.filter((e) => e.kind === "quiz").length}
        />
        <StatCard
          icon={ClipboardList}
          label="Assignments"
          value={done.filter((e) => e.kind === "assignment").length}
        />
        <StatCard icon={Trophy} label="Points earned" value={totalPoints} accent />
      </div>

      {/* Generate panel */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-accent/10 p-5 backdrop-blur mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Milestone (optional)
            </label>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
            >
              <option value="">— General / current focus —</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m?.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => quizM.mutate()}
              disabled={quizM.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/90 px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {quizM.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Daily Quiz
            </button>
            <button
              onClick={() => asgM.mutate()}
              disabled={asgM.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm hover:bg-primary/10 disabled:opacity-50"
            >
              {asgM.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              Assignment
            </button>
            <button
              onClick={() => {
                const title = selected?.project?.title ?? "Milestone project";
                projM.mutate({ projectTitle: title });
              }}
              disabled={projM.isPending || !selected?.project}
              title={!selected?.project ? "Select a milestone with a project" : ""}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm hover:bg-accent/20 disabled:opacity-50"
            >
              {projM.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Submit Project
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["active", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              tab === t
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/60 bg-card/40 hover:bg-primary/10"
            }`}
          >
            {t === "active" ? `Active (${active.length})` : `History (${done.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {(tab === "active" ? active : done).length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {tab === "active"
              ? "No active evaluations. Click the button above to generate one."
              : "No completed evaluations yet."}
          </div>
        )}
        {(tab === "active" ? active : done).map((e) => (
          <EvalCard key={e.id} evalRow={e} onDelete={() => del.mutate(e.id)} onDone={refresh} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: any) {
  return (
    <div
      className={`rounded-xl border p-4 backdrop-blur ${accent ? "border-accent/40 bg-accent/10" : "border-border/60 bg-card/60"}`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function EvalCard({
  evalRow,
  onDelete,
  onDone,
}: {
  evalRow: Eval;
  onDelete: () => void;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const kindMeta = {
    quiz: { icon: Brain, label: "Quiz", color: "text-primary border-primary/40 bg-primary/10" },
    assignment: {
      icon: ClipboardList,
      label: "Assignment",
      color: "text-aurora border-accent/40 bg-accent/10",
    },
    project: { icon: Rocket, label: "Project", color: "text-accent border-accent/40 bg-accent/10" },
  }[evalRow.kind];
  const Icon = kindMeta.icon;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        <div className={`h-10 w-10 rounded-lg border grid place-items-center ${kindMeta.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">
            {kindMeta.label}
            {evalRow.milestone_title && <> · {evalRow.milestone_title}</>}
          </div>
          <div className="font-medium truncate">{evalRow?.title}</div>
        </div>
        {evalRow.status === "evaluated" ? (
          <div className="text-right">
            <div className="font-display text-lg">{evalRow.score}/100</div>
            <div className="text-xs text-xp">+{evalRow.points_awarded} pts</div>
          </div>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            Pending
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-border/60 p-5 space-y-5">
          {evalRow.status === "evaluated" ? (
            <FeedbackView evalRow={evalRow} />
          ) : evalRow.kind === "quiz" ? (
            <QuizForm evalRow={evalRow} onDone={onDone} />
          ) : (
            <SubmissionForm evalRow={evalRow} onDone={onDone} />
          )}
          <div className="flex justify-end">
            <button
              onClick={onDelete}
              className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizForm({ evalRow, onDone }: { evalRow: Eval; onDone: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questions: any[] = evalRow.content?.questions ?? [];
  const m = useMutation({
    mutationFn: async () => {
      let correct = 0;
      const detail: any[] = [];
      questions.forEach((q) => {
        const picked = answers[q.id];
        const isRight = picked === q.correct_index;
        if (isRight) correct++;
        detail.push({
          id: q.id,
          question: q.question,
          picked,
          correct_index: q.correct_index,
          isRight,
          explanation: q.explanation,
        });
      });
      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      const points_awarded = Math.round((score / 100) * 20);
      const feedback = {
        summary: `${correct}/${questions.length} correct`,
        detail,
        encouragement:
          correct === questions.length
            ? "Perfect! 🔥 Try a more challenging quiz tomorrow."
            : correct >= questions.length * 0.6
              ? "Solid effort! Review the explanations for any incorrect answers."
              : "No worries! Read the explanations and try again.",
      };

      await updateDoc(doc(db, "evaluations", evalRow.id), {
        submission: { answers },
        score,
        points_awarded,
        feedback,
        status: "evaluated",
      });

      if (points_awarded > 0) {
        await addDoc(collection(db, "activities"), {
          user_id: evalRow.user_id || auth.currentUser?.uid,
          type: "quiz_evaluated",
          title: `Quiz evaluated: ${evalRow?.title}`,
          xp_earned: points_awarded,
          metadata: { evaluation_id: evalRow.id, score },
          created_at: new Date().toISOString(),
        });

        // Add XP
        const profileRef = doc(db, "profiles", evalRow.user_id || auth.currentUser?.uid || "");
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const prof = profileSnap.data();
          const newXp = (prof?.xp ?? 0) + points_awarded;
          const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
          await updateDoc(profileRef, { xp: newXp, level: newLevel });
        }
      }

      return { score, points_awarded };
    },
    onSuccess: (r: any) => {
      toast.success(`Score: ${r.score}/100 · +${r.points_awarded} pts 🎯`);
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <div className="font-medium">
            <span className="text-muted-foreground mr-2">{i + 1}.</span>
            {q.question}
          </div>
          <div className="grid gap-2">
            {q.options.map((opt: string, oi: number) => {
              const active = answers[q.id] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={`text-left px-3 py-2 rounded-lg border text-sm ${
                    active
                      ? "border-primary bg-primary/15"
                      : "border-border/60 bg-background/40 hover:bg-primary/5"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending || Object.keys(answers).length !== questions.length}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {m.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Submit Quiz
      </button>
    </div>
  );
}

function SubmissionForm({ evalRow, onDone }: { evalRow: Eval; onDone: () => void }) {
  const evalFn = useServerFn(evaluateSubmissionAI);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const m = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      const qDna = query(collection(db, "growth_dna"), where("user_id", "==", user.uid));
      const dnaSnap = await getDocs(qDna);
      const dna = !dnaSnap.empty ? dnaSnap.docs[0].data() : null;

      const qProfile = query(collection(db, "profiles"), where("id", "==", user.uid));
      const profileSnap = await getDocs(qProfile);
      const profile = !profileSnap.empty ? profileSnap.docs[0].data() : null;

      const parsed = await evalFn({
        data: {
          profile,
          dna,
          evalTitle: evalRow?.title,
          instructions:
            evalRow.content?.instructions ?? evalRow.content?.project?.description ?? "",
          rubric: evalRow.content?.rubric ?? [],
          submission: { text, link, videoUrl },
          isProject: evalRow.kind === "project",
        },
      });

      const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
      const points_awarded = Math.round((score / 100) * (evalRow.kind === "assignment" ? 30 : 100));

      await updateDoc(doc(db, "evaluations", evalRow.id), {
        submission: { text, link, videoUrl },
        score,
        points_awarded,
        feedback: parsed,
        status: "evaluated",
      });

      if (points_awarded > 0) {
        await addDoc(collection(db, "activities"), {
          user_id: user.uid,
          type: `${evalRow.kind}_evaluated`,
          title: `${evalRow.kind === "assignment" ? "Assignment" : "Project"} evaluated: ${evalRow?.title}`,
          xp_earned: points_awarded,
          metadata: { evaluation_id: evalRow.id, score },
          created_at: new Date().toISOString(),
        });

        // Add XP
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnapRef = await getDoc(profileRef);
        if (profileSnapRef.exists()) {
          const prof = profileSnapRef.data();
          const newXp = (prof?.xp ?? 0) + points_awarded;
          const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
          await updateDoc(profileRef, { xp: newXp, level: newLevel });
        }
      }

      return { score, points_awarded };
    },
    onSuccess: (r: any) => {
      toast.success(`Evaluated: ${r.score}/100 · +${r.points_awarded} pts 🚀`);
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const c = evalRow.content ?? {};
  return (
    <div className="space-y-4">
      {c.instructions && (
        <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-sm whitespace-pre-wrap">
          {typeof c.instructions === "string" ? c.instructions : JSON.stringify(c.instructions)}
        </div>
      )}
      {c.deliverable && (
        <div className="text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Deliverable: </span>
          {c.deliverable}
        </div>
      )}
      {c.project && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
          <div className="font-medium">{c.project?.title}</div>
          {c.project.description && (
            <div className="text-muted-foreground mt-1">{c.project.description}</div>
          )}
        </div>
      )}
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          What did you build / your answer
        </label>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
          placeholder="Describe what you built, decisions taken, challenges..."
        />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <LinkIcon className="h-3 w-3" /> Link (GitHub / Drive / Live)
          </label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Video className="h-3 w-3" /> Video demo (YouTube / Loom)
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
      </div>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending || (!text && !link && !videoUrl)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {m.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Submit for AI Evaluation
      </button>
    </div>
  );
}

function FeedbackView({ evalRow }: { evalRow: Eval }) {
  const f = evalRow.feedback ?? {};
  if (evalRow.kind === "quiz") {
    return (
      <div className="space-y-3">
        <div className="text-sm">
          {f.summary} — <span className="text-aurora">{f.encouragement}</span>
        </div>
        <div className="space-y-2">
          {(f.detail ?? []).map((d: any) => (
            <div
              key={d.id}
              className={`rounded-lg border p-3 text-sm ${d.isRight ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}
            >
              <div className="flex items-start gap-2">
                {d.isRight ? (
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{d.question}</div>
                  <div className="text-xs text-muted-foreground mt-1">{d.explanation}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      {f.summary && <div className="italic text-aurora">{f.summary}</div>}
      {f.strengths?.length > 0 && (
        <Block title="Strengths" items={f.strengths} icon={CheckCircle2} tone="primary" />
      )}
      {f.improvements?.length > 0 && (
        <Block title="Improvements" items={f.improvements} icon={XCircle} tone="destructive" />
      )}
      {f.next_steps?.length > 0 && (
        <Block title="Next steps" items={f.next_steps} icon={Rocket} tone="accent" />
      )}
    </div>
  );
}

function Block({ title, items, icon: Icon, tone }: any) {
  const c =
    tone === "primary"
      ? "border-primary/30 bg-primary/5 text-primary"
      : tone === "destructive"
        ? "border-destructive/30 bg-destructive/5 text-destructive"
        : "border-accent/30 bg-accent/5 text-accent";
  return (
    <div className={`rounded-lg border p-3 ${c}`}>
      <div className="text-xs uppercase tracking-wider mb-2 opacity-80">{title}</div>
      <ul className="space-y-1 text-foreground">
        {items.map((s: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
