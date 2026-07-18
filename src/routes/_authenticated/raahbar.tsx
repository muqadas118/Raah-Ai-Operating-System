import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { chatWithRaahbarAI } from "@/lib/ai.functions";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  writeBatch,
  doc,
} from "firebase/firestore";

export const Route = createFileRoute("/_authenticated/raahbar")({
  component: RaahbarPage,
});

function RaahbarPage() {
  const qc = useQueryClient();
  const sendFn = useServerFn(chatWithRaahbarAI);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, "chat_messages"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort(
        (a: any, b: any) =>
          new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
      );
      return docs;
    },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
  }, []);

  // Load input draft on mount/auth
  useEffect(() => {
    if (currentUser) {
      const savedInput = localStorage.getItem(`raahbar-input-${currentUser.uid}`);
      if (savedInput) setInput(savedInput);
    }
  }, [currentUser]);

  // Save input draft
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`raahbar-input-${currentUser.uid}`, input);
    }
  }, [currentUser, input]);

  const send = useMutation({
    mutationFn: async (message: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      // Save user message
      await addDoc(collection(db, "chat_messages"), {
        user_id: user.uid,
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      });

      // Fetch context
      const qDna = query(collection(db, "growth_dna"), where("user_id", "==", user.uid));
      const dnaSnap = await getDocs(qDna);
      const dna = !dnaSnap.empty ? dnaSnap.docs[0].data() : null;

      const qProfile = query(collection(db, "profiles"), where("id", "==", user.uid));
      const profileSnap = await getDocs(qProfile);
      const profile = !profileSnap.empty ? profileSnap.docs[0].data() : null;

      const qAssessments = query(collection(db, "assessments"), where("user_id", "==", user.uid));
      const assessmentsSnap = await getDocs(qAssessments);
      const assessments = assessmentsSnap.docs.map((d) => d.data());

      const qProjects = query(collection(db, "projects_forge"), where("user_id", "==", user.uid));
      const projectsSnap = await getDocs(qProjects);
      const projects = projectsSnap.docs.map((d) => d.data());

      const qRoadmap = query(collection(db, "roadmaps"), where("user_id", "==", user.uid));
      const roadmapSnap = await getDocs(qRoadmap);
      const roadmap = !roadmapSnap.empty ? roadmapSnap.docs[0].data() : null;

      const res = await sendFn({
        data: {
          message,
          dna,
          profile,
          assessments,
          projects,
          roadmap,
          history: messages,
        },
      });

      // Save assistant message
      await addDoc(collection(db, "chat_messages"), {
        user_id: user.uid,
        role: "assistant",
        content: res.reply,
        created_at: new Date().toISOString(),
      });

      return res;
    },
    onMutate: () => setInput(""),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat"] }),
    onError: (e: any) => toast.error(e.message ?? "Bhejne me error"),
  });

  const clear = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "chat_messages"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);

      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(doc(db, "chat_messages", d.id));
      });
      await batch.commit();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat"] });
      toast.success("Chat cleared");
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  const suggestions = [
    "Aaj kya sikhun?",
    "Meri weakest DNA axis kaunsi hai?",
    "Ek portfolio project suggest karo",
    "Networking kaise shuru karun?",
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        icon={MessageCircle}
        accent="AI Career Copilot"
        title="Raahbar — Your AI Mentor"
        description="Aapki Growth DNA aur history yaad rakhta hai. Kuch bhi pucho — career, skills, projects, motivation."
      />

      <div className="flex-1 flex flex-col rounded-2xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !send.isPending && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-primary/40 blur-2xl" />
                <Sparkles className="relative h-12 w-12 text-aurora" />
              </div>
              <h3 className="font-display text-xl font-semibold">Salaam! Main Raahbar hoon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Aapki growth journey ka personal mentor. Kuch bhi pucho.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send.mutate(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m: any) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/60 border border-border/60"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {send.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-background/60 border border-border/60 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-aurora" />
                <span className="text-xs text-muted-foreground">Raahbar soch raha hai...</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !send.isPending) send.mutate(input.trim());
          }}
          className="border-t border-border/60 p-3 flex gap-2 bg-background/40"
        >
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => clear.mutate()}
              title="Clear chat"
              className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Raahbar se baat karo..."
            className="flex-1 rounded-lg bg-input/60 border border-border/60 px-4 py-2 text-sm focus:outline-none focus:border-primary"
            disabled={send.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
