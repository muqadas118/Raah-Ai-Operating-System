import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  Sparkles,
  Loader2,
  Flame,
  Hammer,
  Cpu,
  Award,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Lock,
  Code,
  Zap,
  Workflow,
  TrendingUp,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { forgeProjectsAI } from "@/lib/ai.functions";
import { evaluateSubmissionAI } from "@/lib/evaluation.functions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsForgePage,
});

interface ForgedProject {
  id: string;
  title: string;
  tagline: string;
  difficulty: "Advanced" | "Expert";
  google_grade_reason: string;
  architecture: string;
  tech_stack: string[];
  key_features: string[];
  core_challenges: { challenge: string; solution: string }[];
  milestones: { week: string; goals: string[] }[];
  resume_bullet_points: string[];
}

const FORGING_STEPS = [
  "Connecting to RaahAI Growth DNA Core...",
  "Retrieving Technical & Creativity indices...",
  "Calibrating system challenge requirements for FAANG roles...",
  "Analyzing modern scalable architectures (Microservices, Raft, WebSockets)...",
  "Structuring elite production blueprints...",
  "Synthesizing Google-grade CV bullet points (X-Y-Z formula)...",
  "Finalizing Project Forge artifact blueprints...",
];

const DEFAULT_PROJECTS: ForgedProject[] = [
  {
    id: "default_project_1",
    title: "High-Throughput Distributed Ledger with Raft Consensus",
    tagline:
      "A low-latency, resilient append-only transactional ledger with leader election, replication, and log compaction.",
    difficulty: "Expert",
    google_grade_reason:
      "Demonstrates deep mastery of distributed systems consensus, network partition recovery, and high-concurrency log-structured storage engines.",
    architecture: "Distributed Consensus Actor Model (Raft Protocol)",
    tech_stack: ["Go", "gRPC", "Protobuf", "Docker", "Raft", "Redis"],
    key_features: [
      "Distributed write replication with strict multi-node consensus",
      "Leader election under simulated split-brain/network partition states",
      "High-performance gRPC transactional append-only log endpoints",
      "Durable atomic persistence with crash-resilient disk indexing",
    ],
    core_challenges: [
      {
        challenge: "Log growth causing node out-of-memory states.",
        solution:
          "Implemented log compaction via incremental snapshotting and state machine state tracking.",
      },
    ],
    milestones: [
      {
        week: "Week 1",
        goals: ["gRPC service protocol definition", "Leader election state machine"],
      },
      {
        week: "Week 2",
        goals: ["Distributed log replication and commit index", "Simulated partition tests"],
      },
      {
        week: "Week 3",
        goals: ["Durable local storage persistence layer", "Disk compaction snapshotting"],
      },
      {
        week: "Week 4",
        goals: ["Client SDK benchmarking", "Deployment via multi-container Docker Compose"],
      },
    ],
    resume_bullet_points: [
      "Architected a low-latency append-only distributed transactional ledger utilizing the Raft consensus protocol, resulting in 99.999% fault tolerance under network partitions.",
      "Engineered a high-throughput gRPC communication pipeline using Protobuf, cutting transaction serialization overhead by 42%.",
    ],
  },
  {
    id: "default_project_2",
    title: "Real-Time Video Streaming Sync & Collaboration Engine",
    tagline:
      "Ultra-low latency audio-video sync framework resolving network jitter and temporal synchronization across global rooms.",
    difficulty: "Advanced",
    google_grade_reason:
      "Demonstrates real-time communications expertise, temporal synchronization models, and robust multi-threading / WebRTC orchestration.",
    architecture: "WebRTC SFU (Selective Forwarding Unit) with WebSockets Control Channel",
    tech_stack: ["TypeScript", "WebRTC", "WebSockets", "Rust", "FFmpeg", "Redis"],
    key_features: [
      "Sub-50ms visual state replication with temporal drift protection",
      "Dynamic jitter buffer compensation adapting to cellular network drops",
      "FFmpeg audio transcoding pipeline with automatic loudness levelling",
      "STUN/TURN server NAT traversal architecture with ICE candidates negotiation",
    ],
    core_challenges: [
      {
        challenge: "Sub-optimal latency and packet loss on high packet routes.",
        solution:
          "Configured custom forward error correction (FEC) and adaptive bitrate streaming rules.",
      },
    ],
    milestones: [
      {
        week: "Week 1",
        goals: ["WebSocket control channel negotiation", "ICE candidate exchange layer"],
      },
      {
        week: "Week 2",
        goals: ["Media pipeline integration with WebRTC peer connections", "Sub-frame sync checks"],
      },
      {
        week: "Week 3",
        goals: ["FFmpeg audio transcoding and noise suppression filter", "Dynamic bitrate scaling"],
      },
      {
        week: "Week 4",
        goals: [
          "Docker orchestration for scalable SFU node clustering",
          "Benchmarking and stress testing",
        ],
      },
    ],
    resume_bullet_points: [
      "Designed and implemented an ultra-low latency SFU-based audio-video sync framework reducing multi-party temporal sync drift to under 25ms.",
      "Optimized RTC packet processing using a custom Rust-based WebSockets dispatcher, increasing concurrent room capacities by 180%.",
    ],
  },
  {
    id: "default_project_3",
    title: "Zero-Knowledge Proof Authentication Protocol",
    tagline:
      "Cryptographic identity verification service allowing secure auth without passing passwords or shared secrets.",
    difficulty: "Expert",
    google_grade_reason:
      "Showcases cutting-edge cryptographic capability, client-side WebAssembly computation optimization, and mathematically secure state checks.",
    architecture: "zk-SNARK Prover and Verifier Service (SnarkJS / WASM)",
    tech_stack: ["Rust", "WebAssembly", "React", "NextJS", "SnarkJS", "PostgreSQL"],
    key_features: [
      "Client-side zk-SNARK proof generation for lightning-fast locally compiled calculations",
      "Sub-10ms server-side verifier checks using pairing-friendly cryptographic curves",
      "Stateless session integration with OAuth and JWT tokens",
      "Durable privacy-preserving audit logs preserving full anonymous security",
    ],
    core_challenges: [
      {
        challenge: "Heavy mathematical calculations lagging browser main-thread UI.",
        solution:
          "Offloaded zk-SNARK proof synthesis to multi-threaded browser Web Workers utilizing compiled Rust WASM.",
      },
    ],
    milestones: [
      {
        week: "Week 1",
        goals: ["Arithmetic circuit declaration in Circom", "Trusted setup ceremony configuration"],
      },
      {
        week: "Week 2",
        goals: ["Rust WASM prover compilation", "Browser Web Worker orchestration"],
      },
      {
        week: "Week 3",
        goals: ["Server-side cryptographic verifier endpoints", "OAuth token wrapping logic"],
      },
      {
        week: "Week 4",
        goals: ["Privacy-preserving audit log store", "End-to-end integration and security audit"],
      },
    ],
    resume_bullet_points: [
      "Formulated a zero-knowledge proof identity provider using zk-SNARKs, completely mitigating SQL injection risk and credentials exposure vectors.",
      "Optimized client prover computations by 64% by porting arithmetic operations to highly-optimized multi-threaded WebAssembly.",
    ],
  },
];

function ProjectsForgePage() {
  const qc = useQueryClient();
  const genProjectsFn = useServerFn(forgeProjectsAI);
  const evalFn = useServerFn(evaluateSubmissionAI);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [activeProjectIdx, setActiveProjectIdx] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [forgingStepIdx, setForgingStepIdx] = useState<number>(0);

  // Custom states for progressive project submissions
  const [bypassRules, setBypassRules] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionText, setSubmissionText] = useState("");

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
  }, []);

  // Load active tab index on mount
  useEffect(() => {
    if (currentUser) {
      try {
        const savedTab = localStorage.getItem(`projects-active-idx-${currentUser.uid}`);
        if (savedTab !== null) {
          const tabIdx = Number(savedTab);
          if (!isNaN(tabIdx) && tabIdx !== activeProjectIdx) {
            setActiveProjectIdx(tabIdx);
          }
        }
      } catch (e) {
        console.error("Error loading project forge active tab", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Load drafts when tab changes
  useEffect(() => {
    if (currentUser) {
      setIsDraftLoaded(false);
      try {
        const savedDraft = localStorage.getItem(
          `projects-submission-${currentUser.uid}-idx-${activeProjectIdx}`,
        );
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setSubmissionLink(parsed.link ?? "");
          setSubmissionText(parsed.text ?? "");
          setBypassRules(parsed.bypass ?? false);
        } else {
          setSubmissionLink("");
          setSubmissionText("");
          setBypassRules(false);
        }
      } catch (e) {
        console.error("Error loading project forge draft", e);
      } finally {
        setIsDraftLoaded(true);
      }
    }
  }, [currentUser, activeProjectIdx]);

  // Save drafts ONLY when they change (and after draft is loaded)
  useEffect(() => {
    if (currentUser && isDraftLoaded) {
      localStorage.setItem(
        `projects-submission-${currentUser.uid}-idx-${activeProjectIdx}`,
        JSON.stringify({
          link: submissionLink,
          text: submissionText,
          bypass: bypassRules,
        }),
      );
    }
  }, [currentUser, activeProjectIdx, submissionLink, submissionText, bypassRules, isDraftLoaded]);

  const changeTab = (idx: number) => {
    setActiveProjectIdx(idx);
    if (currentUser) {
      localStorage.setItem(`projects-active-idx-${currentUser.uid}`, String(idx));
    }
  };

  // Fetch DNA data
  const { data: dna, isLoading: isDnaLoading } = useQuery({
    queryKey: ["growth_dna", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      const q = query(collection(db, "growth_dna"), where("user_id", "==", currentUser!.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data();
    },
  });

  // Fetch Profile data
  const { data: profile } = useQuery({
    queryKey: ["profile", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      const q = query(collection(db, "profiles"), where("id", "==", currentUser!.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data();
    },
  });

  // Fetch latest roadmap
  const { data: roadmap, isLoading: isRoadmapLoading } = useQuery({
    queryKey: ["roadmap", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      const q = query(collection(db, "roadmaps"), where("user_id", "==", currentUser!.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs[0] as { id: string; milestones: any[]; created_at: string };
    },
  });

  // Fetch all evaluations for tracking milestone + project progression
  const { data: evaluations, isLoading: isEvaluationsLoading } = useQuery({
    queryKey: ["evaluations", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      const q = query(collection(db, "evaluations"), where("user_id", "==", currentUser!.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
    },
  });

  // Fetch existing forged projects
  const { data: forgedData, isLoading: isForgedLoading } = useQuery({
    queryKey: ["forged_projects", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      const q = query(collection(db, "projects_forge"), where("user_id", "==", currentUser!.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort by latest created_at
      docs.sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs[0] as { id: string; projects: ForgedProject[]; created_at: string };
    },
  });

  // Calculate projects array to display (falls back to DEFAULT_PROJECTS if not forged yet)
  const projectsToShow = forgedData?.projects || DEFAULT_PROJECTS;

  // Calculate Roadmap completed milestones
  const getCompletedMilestones = () => {
    if (!roadmap?.milestones || !evaluations) return [];
    return roadmap.milestones.filter((m: any) =>
      evaluations.some((e) => e.milestone_id === m.id && e.status === "evaluated"),
    );
  };
  const completedMilestones = getCompletedMilestones();
  const completedMilestonesCount = completedMilestones.length;
  const totalMilestones = roadmap?.milestones?.length ?? 0;
  const isRoadmapComplete = totalMilestones > 0 && completedMilestonesCount === totalMilestones;

  // Helper to retrieve evaluation record for a specific forge project
  const getProjectEval = (idx: number, projectTitle: string) => {
    if (!evaluations) return null;
    return evaluations.find(
      (e) => e.kind === "project" && (e.forge_project_index === idx || e.title === projectTitle),
    );
  };

  // Helper to decide if project at index should be unlocked
  const isProjectUnlocked = (idx: number, projectTitle: string) => {
    if (bypassRules) return true;

    // First project is immediately unlocked
    if (idx === 0) return true;

    // Consecutive projects unlock only when previous project is complete & evaluated successfully
    const prevProj = projectsToShow[idx - 1];
    if (!prevProj) return false;
    const prevEval = getProjectEval(idx - 1, prevProj.title);
    return prevEval?.status === "evaluated" || prevEval?.status === "passed"; // just in case
  };

  const forgeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");

      // Rotate through step messages during forging
      const interval = setInterval(() => {
        setForgingStepIdx((prev) => (prev < FORGING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2500);

      try {
        const result = await genProjectsFn({ data: { dna, profile } });

        // Save to Firebase
        const docRef = await addDoc(collection(db, "projects_forge"), {
          user_id: currentUser.uid,
          projects: result.projects,
          created_at: new Date().toISOString(),
        });

        // Add to activities feed
        await addDoc(collection(db, "activities"), {
          user_id: currentUser.uid,
          title: "Forged Portfolio Projects",
          description: `Forged 3 elite projects: ${result.projects
            .map((p: { title: string }) => p.title)
            .slice(0, 2)
            .join(", ")} and more.`,
          xp_gained: 100,
          created_at: new Date().toISOString(),
        });

        clearInterval(interval);
        return { id: docRef.id, projects: result.projects };
      } catch (err) {
        clearInterval(interval);
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forged_projects"] });
      changeTab(0);
      setForgingStepIdx(0);
      toast.success("Golden-grade portfolio blueprints forged successfully!");
    },
    onError: (err) => {
      console.error(err);
      setForgingStepIdx(0);
      toast.error("Failed to forge projects. Please try again.");
    },
  });

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Resume bullet copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const evalMutation = useMutation({
    mutationFn: async ({
      index,
      projectTitle,
      description,
      githubUrl,
    }: {
      index: number;
      projectTitle: string;
      description: string;
      githubUrl: string;
    }) => {
      setSubmittingIdx(index);
      if (!currentUser) throw new Error("Not signed in");

      // 1. Call the AI evaluator to grade the submission
      const result = await evalFn({
        data: {
          profile,
          dna,
          evalTitle: projectTitle,
          instructions: projectsToShow[index].google_grade_reason,
          rubric: [
            "Scale-ready system architecture design",
            "Resolving deep multi-threading, concurrency, or network performance bottlenecks",
            "Plausibility and implementation detail depth of solution",
          ],
          submission: { text: description, link: githubUrl },
          isProject: true,
        },
      });

      const score = Math.max(0, Math.min(100, Number(result.score) || 0));
      // Award 150 XP for completing a Forge project!
      const points_awarded = Math.round((score / 100) * 150);

      // 2. Add evaluation document to Firestore
      const evalRef = await addDoc(collection(db, "evaluations"), {
        user_id: currentUser.uid,
        kind: "project",
        forge_project_index: index,
        title: projectTitle,
        content: {
          project: projectsToShow[index],
          instructions:
            "Submit your repository link and a short description. RaahAI will analyze your implementation and grade it.",
        },
        submission: { text: description, link: githubUrl },
        score,
        points_awarded,
        feedback: result,
        status: "evaluated",
        created_at: new Date().toISOString(),
      });

      // 3. Add to activity feed
      await addDoc(collection(db, "activities"), {
        user_id: currentUser.uid,
        title: `Forge Project Evaluated: ${projectTitle}`,
        description: `Passed evaluation with score of ${score}/100.`,
        xp_gained: points_awarded,
        created_at: new Date().toISOString(),
      });

      // 4. Update profile XP
      const profileRef = doc(db, "profiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const prof = profileSnap.data();
        const currentXp = Number(prof?.xp) || 0;
        const newXp = currentXp + points_awarded;
        const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
        await updateDoc(profileRef, { xp: newXp, level: newLevel });
      }

      return { score, points_awarded };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(
        `Project Evaluated! Score: ${res.score}/100. Earned +${res.points_awarded} XP! 🎉`,
      );
      setSubmittingIdx(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message ?? "Evaluation failed. Please try again.");
      setSubmittingIdx(null);
    },
  });

  const [submittingIdx, setSubmittingIdx] = useState<number | null>(null);
  const isForging = forgeMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader
        icon={FolderKanban}
        accent="Project Forge"
        title="Google-Grade Portfolio Blueprints"
        description="Transform your Growth DNA and roadmaps into high-impact, elite portfolio artifacts designed to pass rigorous elite-tech reviews."
      />

      {/* ROADMAP PROGRESS TRACKER & DEV BYPASS BAR */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-5 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Roadmap Milestone Progression</h4>
              {isRoadmapComplete ? (
                <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  UNLOCKED
                </span>
              ) : (
                <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  GATED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-light">
              Complete all milestones in your Roadmap to auto-unlock the first elite project!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-40 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${totalMilestones > 0 ? (completedMilestonesCount / totalMilestones) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {completedMilestonesCount}/{totalMilestones} Passed
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Dev Bypass Switch */}
          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/60 px-3 py-1.5 rounded-lg">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 select-none cursor-pointer">
              Bypass Gates
            </label>
            <button
              onClick={() => {
                setBypassRules(!bypassRules);
                toast.info(
                  bypassRules
                    ? "Developer locks active."
                    : "Developer bypass activated! All projects fully unlocked. 🔓",
                );
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                bypassRules ? "bg-sky-500" : "bg-slate-800"
              }`}
              title="Toggle to instantly bypass roadmap milestones and locking gates"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                  bypassRules ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SLEEK GLASSMORPHIC HERO SECTION */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl mb-10">
        {/* Abstract Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Hero Content */}
        <div className="relative z-10 pt-16 pb-12 px-6 md:px-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
            {isForging ? (
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            ) : (
              <FolderKanban className="w-8 h-8 text-sky-400" />
            )}
          </div>

          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {forgedData ? "Active Project Forge" : "Forge Google-Grade Portfolios"}
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Tailored advanced challenges that showcase deep technical mastery, architectural
              competence, and stellar engineering craftsmanship to top-tier tech companies.
            </p>
          </div>

          {/* DNA stats preview if loaded */}
          {dna && !isForging && (
            <div className="mt-8 flex flex-wrap gap-4 items-center justify-center bg-slate-900/80 backdrop-blur-md border border-slate-800 px-5 py-3 rounded-full text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <User className="w-3.5 h-3.5" />
                {profile?.full_name || "Growth Engineer"} ({dna.overall_level})
              </span>
              <span className="h-4 w-px bg-slate-800 hidden sm:inline" />
              <span className="flex items-center gap-1.5">
                Tech: <strong className="text-white">{dna.technical_score}</strong>
              </span>
              <span className="h-4 w-px bg-slate-800" />
              <span className="flex items-center gap-1.5">
                Create: <strong className="text-white">{dna.creativity_score}</strong>
              </span>
              <span className="h-4 w-px bg-slate-800" />
              <span className="flex items-center gap-1.5">
                Discipline: <strong className="text-white">{dna.discipline_score}</strong>
              </span>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="mt-10">
            {isForging ? (
              <div className="flex flex-col items-center">
                <button
                  disabled
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm font-medium cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Forging Portfolios...
                </button>
                {/* Scrolling logging step */}
                <p className="mt-4 text-[11px] font-mono tracking-wider text-sky-400/80 animate-pulse bg-slate-900 border border-sky-900/50 px-4 py-1.5 rounded-full">
                  {FORGING_STEPS[forgingStepIdx]}
                </p>
              </div>
            ) : (
              <button
                onClick={() => forgeMutation.mutate()}
                className="group relative flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <FolderKanban className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                {forgedData ? "Re-Forge Custom Blueprints" : "Forge Portfolio Blueprints"}
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FORGED BLUEPRINTS VIEWER */}
      {isForgedLoading || isEvaluationsLoading || isRoadmapLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Loading portfolio blueprints...</p>
        </div>
      ) : projectsToShow.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Side Tabs List (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1 mb-1">
              Active Artifact Blueprints
            </h3>
            {projectsToShow.map((project, idx) => {
              const isActive = activeProjectIdx === idx;
              const unlocked = isProjectUnlocked(idx, project.title);
              const pEval = getProjectEval(idx, project.title);
              return (
                <button
                  key={project.id || idx}
                  onClick={() => changeTab(idx)}
                  className={`relative w-full text-left p-4 rounded-xl transition-all border duration-200 ${
                    isActive
                      ? "bg-slate-900 border-sky-500/50 shadow-md shadow-sky-500/5"
                      : "bg-slate-950 hover:bg-slate-900/40 border-slate-800"
                  }`}
                >
                  {/* Left accent border */}
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-sky-500 rounded-l-xl" />
                  )}

                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate pr-1 flex items-center gap-1.5">
                      {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      {unlocked && pEval?.status === "evaluated" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      {project.title}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                        project.difficulty === "Expert"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {project.difficulty}
                    </span>
                  </div>
                  <p
                    className={`text-xs text-slate-400 line-clamp-2 ${
                      !unlocked ? "filter blur-[1px] select-none opacity-60" : ""
                    }`}
                  >
                    {project.tagline}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800/80"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <span className="text-[9px] font-mono text-slate-500 px-1 py-0.5">
                        +{project.tech_stack.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Micro Forge Info Card */}
            <div className="bg-gradient-to-r from-blue-950/20 to-sky-950/20 border border-sky-950 rounded-xl p-4 mt-2">
              <div className="flex gap-2 items-start">
                <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white mb-1">
                    What makes a project "Google-Grade"?
                  </p>
                  <p className="text-slate-400 leading-relaxed font-light">
                    Top-tier companies look for systems resolving deep issues like thread-safety,
                    network bottlenecks, consensus synchronization, caching layers, and database
                    consistency. Toy apps don't impress; core architectural resilience does.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Blueprint Detail Viewer (8 Cols) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {projectsToShow[activeProjectIdx] &&
                (() => {
                  const project = projectsToShow[activeProjectIdx];
                  const unlocked = isProjectUnlocked(activeProjectIdx, project.title);
                  const projectEval = getProjectEval(activeProjectIdx, project.title);

                  return (
                    <motion.div
                      key={activeProjectIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden"
                    >
                      {/* Glassmorphic Lock Screen Overlay */}
                      {!unlocked && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800">
                          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 mb-4 animate-bounce">
                            <Lock className="w-7 h-7" />
                          </div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                            Blueprint Locked 🔒
                          </h3>
                          {activeProjectIdx === 0 ? (
                            <div className="max-w-sm mt-2">
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Complete all milestones on your Roadmap to unlock this elite-tech
                                portfolio blueprint!
                              </p>
                              <span className="inline-block text-amber-500 text-xs font-semibold mt-3 bg-amber-500/10 px-3 py-1 rounded border border-amber-500/20">
                                Progress: {completedMilestonesCount}/{totalMilestones} Milestones
                                passed
                              </span>
                            </div>
                          ) : (
                            <div className="max-w-sm mt-2">
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Complete and pass the evaluation for{" "}
                                <strong>Project {activeProjectIdx}</strong> to unlock this
                                next-level blueprint!
                              </p>
                            </div>
                          )}

                          <div className="mt-6 flex gap-3">
                            <a
                              href={activeProjectIdx === 0 ? "/roadmap" : "#"}
                              onClick={(e) => {
                                if (activeProjectIdx > 0) {
                                  e.preventDefault();
                                  changeTab(activeProjectIdx - 1);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-xs hover:bg-sky-400 transition shadow-lg shadow-sky-500/20"
                            >
                              {activeProjectIdx === 0
                                ? "Go to My Roadmap 🗺️"
                                : `Go to Project ${activeProjectIdx} 🚀`}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Outer wrapper with conditional blur effect so user sees a sneak-peek outline ("thora thora") */}
                      <div
                        className={
                          !unlocked
                            ? "filter blur-md select-none pointer-events-none opacity-30"
                            : ""
                        }
                      >
                        {/* Title & Badge Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sky-500 text-xs uppercase font-mono tracking-wider font-semibold">
                                Blueprint #{activeProjectIdx + 1}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs text-slate-400">
                                Created{" "}
                                {forgedData
                                  ? new Date(forgedData.created_at).toLocaleDateString()
                                  : "Just Now"}
                              </span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
                              {project.title}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">{project.tagline}</p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span
                              className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full ${
                                project.difficulty === "Expert"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {project.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Why Google Recruiter Block */}
                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-sky-950/20 to-slate-950 border-l-4 border-sky-500 border border-slate-900">
                          <div className="flex gap-2.5">
                            <Award className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                                The Google-Grade Pitch
                              </h4>
                              <p className="text-slate-200 text-sm mt-1 font-light leading-relaxed">
                                {project.google_grade_reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Architecture & Tech Stack Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                          {/* Core Architecture */}
                          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                              <Workflow className="w-4 h-4 text-emerald-400" />
                              System Architecture
                            </h4>
                            <p className="text-slate-300 text-sm font-medium leading-relaxed">
                              {project.architecture}
                            </p>
                          </div>

                          {/* Tech Stack Badges */}
                          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                              <Code className="w-4 h-4 text-amber-400" />
                              Forged Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {project.tech_stack.map((tech) => (
                                <span
                                  key={tech}
                                  className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-md text-slate-300 border border-slate-800"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Deliverables / Key Features */}
                        <div className="mt-8">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-sky-400" />
                            Key Features & Deliverables
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {project.key_features.map((feature, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 bg-slate-900/20 border border-slate-900/60 p-3 rounded-lg text-slate-300 text-xs"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Core Challenges */}
                        <div className="mt-8">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            Critical Challenges & Solves
                          </h3>
                          <div className="space-y-4">
                            {project.core_challenges.map((item, i) => (
                              <div
                                key={i}
                                className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl"
                              >
                                <p className="text-xs font-bold text-red-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  CHALLENGE: {item.challenge}
                                </p>
                                <p className="text-slate-300 text-xs mt-2 pl-2.5 border-l-2 border-emerald-500/40 leading-relaxed font-light">
                                  <strong className="text-emerald-400 font-medium">
                                    SOLUTION:
                                  </strong>{" "}
                                  {item.solution}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4-Week Milestone Schedule */}
                        <div className="mt-8 border-t border-slate-800 pt-8">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            4-Week Milestone Execution Plan
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {project.milestones.map((m, i) => (
                              <div
                                key={i}
                                className="relative bg-slate-900/25 border border-slate-900 p-4 rounded-xl"
                              >
                                <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-600 font-semibold">
                                  0{i + 1}
                                </div>
                                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                                  {m.week}
                                </h4>
                                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-400 list-disc pl-3">
                                  {m.goals.map((g, j) => (
                                    <li key={j} className="leading-tight">
                                      {g}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Copyable Resume Bullet Points (X-Y-Z formula) */}
                        <div className="mt-8 border-t border-slate-800 pt-8">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                            <Terminal className="w-4 h-4 text-sky-400" />
                            Google-Style CV Bullet Points (X-Y-Z Formula)
                          </h3>
                          <p className="text-xs text-slate-400 mb-4 leading-normal font-light">
                            Add these direct bullets to your CV/portfolio description. They are
                            written in the exact Google recruiting standard format (Accomplished [X]
                            as measured by [Y], by doing [Z]).
                          </p>
                          <div className="space-y-3">
                            {project.resume_bullet_points.map((bullet, i) => (
                              <div
                                key={i}
                                className="group relative flex items-start justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors"
                              >
                                <div className="flex gap-2">
                                  <span className="text-sky-500 font-semibold font-mono text-xs select-none mt-0.5">
                                    &gt;
                                  </span>
                                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                                    {bullet}
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleCopy(bullet, i)}
                                  className="text-slate-500 hover:text-white p-1 rounded-md bg-slate-900 hover:bg-slate-800 transition-all flex-shrink-0"
                                  title="Copy Bullet Point"
                                >
                                  {copiedIndex === i ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* PROJECT EVALUATION / SUBMISSION PANEL */}
                        <div className="mt-12 border-t border-slate-800 pt-8">
                          <div className="rounded-2xl border border-sky-900/40 bg-gradient-to-br from-slate-950 via-[#0a1128] to-[#0d1c44] p-6 md:p-8 relative overflow-hidden">
                            {/* Grid background effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                            <div className="relative z-10">
                              {/* Status Header */}
                              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                                    <Workflow className="w-5 h-5 animate-pulse" />
                                  </div>
                                  <div>
                                    <h3 className="text-base font-semibold text-white">
                                      Elite Certification & AI Review
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                      Submit your repository to analyze system complexity,
                                      correctness, and CV impact.
                                    </p>
                                  </div>
                                </div>

                                {/* Dynamic Badge */}
                                {projectEval ? (
                                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    EVALUATED
                                  </span>
                                ) : (
                                  <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5 text-amber-400" />
                                    READY FOR EVALUATION
                                  </span>
                                )}
                              </div>

                              {/* If already evaluated, show gorgeous score summary & feedback */}
                              {projectEval ? (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-950/60 p-6 rounded-xl border border-slate-900">
                                    {/* Score display (left 4 cols) */}
                                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-900 pb-6 md:pb-0 md:pr-6">
                                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                                        Final Grade
                                      </span>
                                      <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/30">
                                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent" />
                                        <span className="text-3xl font-display font-extrabold text-emerald-400">
                                          {projectEval.score}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-400 mt-2 font-mono">
                                        +{projectEval.points_awarded} XP Awarded
                                      </span>
                                    </div>

                                    {/* Verdict & Summary (right 8 cols) */}
                                    <div className="md:col-span-8 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                          {projectEval.feedback?.verdict ?? "PASSED"}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                          Reviewed by RaahAI
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-semibold text-white">
                                        Evaluation Summary
                                      </h4>
                                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                                        {projectEval.feedback?.summary}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Detailed Feedback Tabs */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Strengths */}
                                    <div className="bg-emerald-950/10 border border-emerald-950/40 p-4 rounded-xl">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        Core Architectural Strengths
                                      </h4>
                                      <ul className="space-y-2 text-xs text-slate-300">
                                        {projectEval.feedback?.strengths?.map(
                                          (item: string, i: number) => (
                                            <li
                                              key={i}
                                              className="flex gap-2 items-start font-light"
                                            >
                                              <span className="text-emerald-400 font-bold">
                                                &bull;
                                              </span>
                                              <span>{item}</span>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>

                                    {/* Areas for Improvement */}
                                    <div className="bg-amber-950/10 border border-amber-950/40 p-4 rounded-xl">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        Areas for Improvement
                                      </h4>
                                      <ul className="space-y-2 text-xs text-slate-300">
                                        {projectEval.feedback?.improvements?.map(
                                          (item: string, i: number) => (
                                            <li
                                              key={i}
                                              className="flex gap-2 items-start font-light"
                                            >
                                              <span className="text-amber-400 font-bold">
                                                &bull;
                                              </span>
                                              <span>{item}</span>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  </div>

                                  {/* Next Steps */}
                                  {projectEval.feedback?.next_steps?.length > 0 && (
                                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                                        Suggested Next Steps
                                      </h4>
                                      <ul className="space-y-1.5 text-xs text-slate-300 pl-3 list-decimal">
                                        {projectEval.feedback.next_steps.map(
                                          (step: string, i: number) => (
                                            <li key={i} className="leading-relaxed font-light">
                                              {step}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Next project unlock notification */}
                                  {activeProjectIdx < projectsToShow.length - 1 && (
                                    <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-emerald-950 p-4 rounded-xl">
                                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                                      <div className="text-xs">
                                        <p className="font-semibold text-white">
                                          Next Project Unlocked! 🎉
                                        </p>
                                        <p className="text-slate-400 mt-0.5">
                                          Project {activeProjectIdx + 2}:{" "}
                                          <strong>
                                            {projectsToShow[activeProjectIdx + 1].title}
                                          </strong>{" "}
                                          is now fully accessible in your sidebar.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Submission Form */
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                                      GitHub Repository or Live Link
                                      <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                      type="url"
                                      placeholder="https://github.com/username/project-repo"
                                      value={submissionLink}
                                      onChange={(e) => setSubmissionLink(e.target.value)}
                                      className="w-full text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                                      Technical Solution Details
                                      <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                      rows={4}
                                      placeholder="Describe your architecture. How did you handle threading/concurrency, network synchronization, storage persistence, and performance bottlenecks?"
                                      value={submissionText}
                                      onChange={(e) => setSubmissionText(e.target.value)}
                                      className="w-full text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-light resize-none leading-relaxed"
                                    />
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (!submissionLink || !submissionText) {
                                        toast.error(
                                          "Please fill in both repository link and technical description.",
                                        );
                                        return;
                                      }
                                      evalMutation.mutate({
                                        index: activeProjectIdx,
                                        projectTitle: project.title,
                                        description: submissionText,
                                        githubUrl: submissionLink,
                                      });
                                    }}
                                    disabled={evalMutation.isPending}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90 font-semibold text-xs text-white transition-all disabled:opacity-50"
                                  >
                                    {evalMutation.isPending ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        RaahAI is analyzing your architecture... (takes ~15s)
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                                        Submit & Request AI Evaluation
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 bg-slate-950 border border-slate-900 rounded-2xl text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Artifacts Currently Locked</h3>
          <p className="text-sm text-slate-400 max-w-md mt-2 font-light">
            You haven't forged portfolio projects yet. Press the glowing "Forge Portfolio
            Blueprints" trigger on the mountain range above to construct your customized
            roadmap-ready elite project specs!
          </p>
        </div>
      )}
    </div>
  );
}
