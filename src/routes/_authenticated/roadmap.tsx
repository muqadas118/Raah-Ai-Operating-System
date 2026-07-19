import { FormatText } from "@/components/format-text";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Map,
  Sparkles,
  Loader2,
  Youtube,
  BookOpen,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Rocket,
  CheckCircle2,
  Mountain,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { generateRoadmapAI } from "@/lib/ai.functions";
import { toast } from "sonner";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

type Resource = { type: string; title: string; author_or_channel: string; url: string };
type Milestone = {
  id: string;
  title: string;
  duration_days: number;
  why: string;
  skills: string[];
  resources: Resource[];
  project: {
    title: string;
    description: string;
    deliverables: string[];
    tech_stack: string[];
    portfolio_pitch: string;
  };
  checkpoints: string[];
};

const resourceIcon = (t: string) => {
  const T = t.toLowerCase();
  if (T.includes("youtube") || T.includes("video")) return Youtube;
  if (T.includes("book")) return BookOpen;
  if (T.includes("doc") || T.includes("article")) return FileText;
  if (T.includes("course")) return GraduationCap;
  return LinkIcon;
};

function RoadmapPage() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateRoadmapAI);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const q = query(collection(db, "roadmaps"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
        id: string;
        created_at?: string;
        title?: string;
        summary?: string;
        milestones?: Milestone[];
      }[];
      docs.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs[0];
    },
  });

  const gen = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      // Fetch necessary data
      const qAss = query(collection(db, "assessments"), where("user_id", "==", user.uid));
      const assSnap = await getDocs(qAss);
      const assDocs = assSnap.docs.map((d) => d.data()).filter((d) => d.completed === true);
      assDocs.sort(
        (a: { created_at?: string }, b: { created_at?: string }) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );

      const qDna = query(collection(db, "growth_dna"), where("user_id", "==", user.uid));
      const dnaSnap = await getDocs(qDna);
      const dna = !dnaSnap.empty ? dnaSnap.docs[0].data() : null;

      let assessment = assDocs.length > 0 ? assDocs[0] : null;
      if (!assessment && dna) {
        // Build a synthetic assessment from DNA so they are never locked out of generating roadmaps
        assessment = {
          user_id: user.uid,
          completed: true,
          answers: {
            focus_now: dna.overall_level || "Explorer",
          },
          created_at: dna.updated_at || new Date().toISOString(),
        };
      }

      const qProfile = query(collection(db, "profiles"), where("id", "==", user.uid));
      const profileSnap = await getDocs(qProfile);
      const profile = !profileSnap.empty ? profileSnap.docs[0].data() : null;

      if (!assessment) throw new Error("Please complete the Growth DNA assessment first.");

      // Call AI
      const parsed = await genFn({ data: { assessment, dna, profile } });

      // Delete old roadmap
      if (roadmap?.id) {
        await deleteDoc(doc(db, "roadmaps", roadmap.id));
      }

      // Save to Firebase
      const newRoadmapRef = await addDoc(collection(db, "roadmaps"), {
        user_id: user.uid,
        title: parsed?.title ?? "My Growth Roadmap",
        summary: parsed.summary ?? "",
        milestones: parsed.milestones ?? [],
        meta: { model: "gemini-2.5-flash" },
        created_at: new Date().toISOString(),
      });

      // Log activity
      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        type: "roadmap_generated",
        title: "AI Roadmap generated",
        xp_earned: 50,
        created_at: new Date().toISOString(),
      });

      return parsed;
    },
    onSuccess: () => {
      toast.success("Roadmap ready! ✨");
      qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error(e?.message ? e.message : "Failed to generate roadmap - " + JSON.stringify(e));
    },
  });

  const milestones: Milestone[] = (roadmap?.milestones as Milestone[]) ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        icon={Map}
        accent="Dynamic Roadmap"
        title="Your Growth Journey"
        description="AI-crafted milestones based on your Growth DNA — real resources, real projects, portfolio-ready."
      />

      {!roadmap && !isLoading && (
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/60 to-accent/10 p-10 text-center backdrop-blur glow-primary">
          <Rocket className="mx-auto h-12 w-12 text-primary mb-3" />
          <h3 className="font-display text-2xl font-bold">Generate your personal roadmap</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            RaahAI will analyze your DNA assessment and create a structured roadmap with real YouTube videos, books, docs, and a proper portfolio project for each milestone.
          </p>
          <button
            onClick={() => gen.mutate()}
            disabled={gen.isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {gen.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {gen.isPending ? "AI is thinking..." : "Generate My Roadmap"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-20 text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      )}

      {roadmap && (
        <>
          <div className="mb-8 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-aurora">{roadmap?.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{roadmap.summary}</p>
            </div>
            <button
              onClick={() => gen.mutate()}
              disabled={gen.isPending}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs hover:bg-primary/10"
            >
              {gen.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Regenerate
            </button>
          </div>

          {/* Visual journey path */}
          <div className="relative">
            {/* Cosmic path SVG line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-aurora to-accent opacity-40 md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-8">
              {milestones.map((m, i) => {
                const isOpen = openId === m.id;
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={m.id ?? i}
                    className={`relative md:flex ${isLeft ? "md:justify-start" : "md:justify-end"}`}
                  >
                    {/* Node marker */}
                    <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/40 blur-lg animate-pulse" />
                        <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary via-aurora to-accent flex items-center justify-center font-display text-xl font-bold text-primary-foreground border-2 border-background shadow-lg">
                          {i + 1}
                        </div>
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      className={`ml-24 md:ml-0 md:w-[46%] ${isLeft ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : m.id)}
                        className="w-full text-left rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-5 hover:border-primary/60 transition group"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          {i === 0 && <Star className="h-3 w-3 text-xp" />}
                          {i === milestones.length - 1 && (
                            <Mountain className="h-3 w-3 text-accent" />
                          )}
                          <span>{m.duration_days} days</span>
                          <span>·</span>
                          <span>{m.skills?.slice(0, 2).join(", ")}</span>
                        </div>
                        <h3 className="font-display text-lg font-semibold group-hover:text-aurora transition">
                          {m?.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2"><FormatText text={m.why} /></p>
                      </button>

                      {isOpen && (
                        <div className="mt-3 rounded-2xl border border-primary/30 bg-background/60 backdrop-blur p-5 space-y-5">
                          {/* Skills */}
                          {m.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {m.skills.map((s) => (
                                <span
                                  key={s}
                                  className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Resources */}
                          {m.resources?.length > 0 && (
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                Learn from
                              </h4>
                              <div className="space-y-2">
                                {m.resources.map((r, ri) => {
                                  const Icon = resourceIcon(r.type);
                                  const inner = (
                                    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 p-3 hover:border-accent/60 transition">
                                      <Icon className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">
                                          {r?.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {r.author_or_channel} · {r.type}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                  return r.url ? (
                                    <a
                                      key={ri}
                                      href={r.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block"
                                    >
                                      {inner}
                                    </a>
                                  ) : (
                                    <div key={ri}>{inner}</div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Project */}
                          {m.project && (
                            <div className="rounded-xl border border-accent/40 bg-gradient-to-br from-accent/10 to-primary/5 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Rocket className="h-4 w-4 text-accent" />
                                <span className="text-xs uppercase tracking-wider text-accent font-semibold">
                                  Portfolio Project
                                </span>
                              </div>
                              <h4 className="font-display font-semibold">{m.project?.title}</h4>
                              <p className="mt-1 text-sm text-muted-foreground">
                                <FormatText text={m.project.description} />
                              </p>
                              {m.project.tech_stack?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {m.project.tech_stack.map((t) => (
                                    <span
                                      key={t}
                                      className="text-[10px] px-2 py-0.5 rounded bg-background/60 text-muted-foreground border border-border/50"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {m.project.deliverables?.length > 0 && (
                                <ul className="mt-3 space-y-1">
                                  {m.project.deliverables.map((d, di) => (
                                    <li
                                      key={di}
                                      className="text-xs text-muted-foreground flex gap-2"
                                    >
                                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-accent shrink-0" />
                                      <span>{d}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {m.project.portfolio_pitch && (
                                <div className="mt-3 text-xs italic text-aurora">
                                  "{m.project.portfolio_pitch}"
                                </div>
                              )}
                            </div>
                          )}

                          {/* Checkpoints */}
                          {m.checkpoints?.length > 0 && (
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                Checkpoints
                              </h4>
                              <ul className="space-y-1">
                                {m.checkpoints.map((c, ci) => (
                                  <li key={ci} className="text-sm flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summit */}
            <div className="relative mt-8 flex justify-center">
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 -top-2">
                <Mountain className="h-16 w-16 text-accent drop-shadow-[0_0_20px_oklch(0.78_0.15_200/0.6)]" />
              </div>
              <div className="ml-24 md:ml-0 md:mt-20 text-center">
                <div className="font-display text-lg text-aurora">Summit unlocked 🏔️</div>
                <div className="text-xs text-muted-foreground">
                  Complete all milestones to level up
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
