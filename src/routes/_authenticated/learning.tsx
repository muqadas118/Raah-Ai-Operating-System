import { FormatText } from "@/components/format-text";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Play,
  Award,
  Terminal,
  Code,
  Cpu,
  Database,
  Compass,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Check,
  Flame,
  ArrowRight,
  ArrowLeft,
  BookMarked,
  Info,
  Laptop,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { generateDailyMissionAI } from "@/lib/ai.functions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export const Route = createFileRoute("/_authenticated/learning")({
  component: LearningPage,
});

type DailyMission = {
  day: number;
  title: string;
  focusTopic: string;
  ide_and_tools: {
    recommended_ide: string;
    required_tools: string[];
    setup_steps: string[];
  };
  time_breakdown: {
    duration_minutes: number;
    activity: string;
    description: string;
    step_by_step_instruction: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    hint: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correct_option_index: number;
    explanation: string;
  };
  motivation_quote: string;
};

function LearningPage() {
  const qc = useQueryClient();
  const generateDailyMissionFn = useServerFn(generateDailyMissionAI);
  const [viewDay, setViewDay] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number>(0);
  const [particles, setParticles] = useState<
    { id: number; char: string; left: number; delay: number }[]
  >([]);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
  }, []);

  const user = currentUser || auth.currentUser;

  // 1. Fetch User Roadmap
  const { data: roadmap, isLoading: isRoadmapLoading } = useQuery({
    queryKey: ["roadmap_active"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const q = query(collection(db, "roadmaps"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs[0] as any;
    },
  });

  // 2. Fetch User Learning Progress
  const {
    data: progress,
    isLoading: isProgressLoading,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: ["learning_progress"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { current_day: 1, completed_days: [] };
      const q = query(collection(db, "learning_progress"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { current_day: 1, completed_days: [] };
      }
      return snap.docs[0].data() as { current_day: number; completed_days: number[] };
    },
  });

  // Update viewDay to match user's current day upon progress load
  useEffect(() => {
    if (progress?.current_day) {
      setViewDay(progress.current_day);
    }
  }, [progress]);

  const [isDayDraftLoaded, setIsDayDraftLoaded] = useState(false);

  // Reset or load day-specific states when viewing a different day
  useEffect(() => {
    if (currentUser && viewDay) {
      setIsDayDraftLoaded(false);
      try {
        const saved = localStorage.getItem(`learning-day-${viewDay}-${currentUser.uid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSelectedOption(parsed.selectedOption !== undefined ? parsed.selectedOption : null);
          setQuizSubmitted(parsed.quizSubmitted !== undefined ? parsed.quizSubmitted : false);
          setCompletedTasks(parsed.completedTasks !== undefined ? parsed.completedTasks : []);
          setActiveSegmentIdx(parsed.activeSegmentIdx !== undefined ? parsed.activeSegmentIdx : 0);
        } else {
          setSelectedOption(null);
          setQuizSubmitted(false);
          setCompletedTasks([]);
          setActiveSegmentIdx(0);
        }
      } catch (e) {
        console.error("Error loading day draft", e);
      } finally {
        setIsDayDraftLoaded(true);
      }
    }
  }, [currentUser, viewDay]);

  // Save drafts when changed
  useEffect(() => {
    if (currentUser && viewDay && isDayDraftLoaded) {
      localStorage.setItem(
        `learning-day-${viewDay}-${currentUser.uid}`,
        JSON.stringify({
          selectedOption,
          quizSubmitted,
          completedTasks,
          activeSegmentIdx,
        }),
      );
    }
  }, [
    currentUser,
    viewDay,
    selectedOption,
    quizSubmitted,
    completedTasks,
    activeSegmentIdx,
    isDayDraftLoaded,
  ]);

  // 3. Fetch/Generate Daily Learning Mission
  const {
    data: mission,
    isLoading: isMissionLoading,
    isError: isMissionError,
    refetch: refetchMission,
  } = useQuery({
    queryKey: ["daily_mission", viewDay, roadmap?.id],
    enabled: !!roadmap && !!user,
    queryFn: async () => {
      if (!user || !roadmap) return null;
      const q = query(
        collection(db, "daily_missions"),
        where("user_id", "==", user.uid),
        where("day", "==", viewDay),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as DailyMission;
      }

      // If not generated, call the generator
      const res = await generateDailyMissionFn({
        data: {
          roadmap,
          dayNumber: viewDay,
          dna: null,
          profile: null,
        },
      });

      // Save to Firebase for persistent caching
      await addDoc(collection(db, "daily_missions"), {
        user_id: user.uid,
        ...res,
        created_at: new Date().toISOString(),
      });

      return res as DailyMission;
    },
  });

  // Mutation to complete the mission
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !mission) return;

      // 1. Add XP + update level
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const prof = profileSnap.data();
        const currentXp = Number(prof?.xp) || 0;
        const newXp = currentXp + 50;
        const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
        await updateDoc(profileRef, { xp: newXp, level: newLevel });
      }

      // 2. Log activity
      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        type: "learning_mission_completed",
        title: `Day ${mission.day} Complete!`,
        description: `Successfully completed: "${mission?.title}" in 1-hour focus.`,
        xp_earned: 50,
        created_at: new Date().toISOString(),
      });

      // 3. Save learning progress
      const qProgress = query(
        collection(db, "learning_progress"),
        where("user_id", "==", user.uid),
      );
      const progressSnap = await getDocs(qProgress);
      const currentCompleted = progress?.completed_days || [];
      const updatedCompleted = currentCompleted.includes(mission.day)
        ? currentCompleted
        : [...currentCompleted, mission.day];

      const nextDay = mission.day + 1;

      if (progressSnap.empty) {
        // Create progress doc
        const progressRef = doc(collection(db, "learning_progress"));
        await setDoc(progressRef, {
          user_id: user.uid,
          current_day: nextDay,
          completed_days: updatedCompleted,
          created_at: new Date().toISOString(),
        });
      } else {
        const pDoc = progressSnap.docs[0];
        await updateDoc(doc(db, "learning_progress", pDoc.id), {
          current_day: nextDay,
          completed_days: updatedCompleted,
        });
      }
    },
    onSuccess: () => {
      triggerParticles();
      toast.success(`Session completed! +50 XP Earned! 🎓✨`);
      qc.invalidateQueries({ queryKey: ["learning_progress"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      // Go to next day
      setViewDay((prev) => prev + 1);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("An error occurred while saving your progress.");
    },
  });

  const triggerParticles = () => {
    const chars = ["🎉", "✨", "🚀", "🔥", "🏆", "👏", "💡", "🧠"];
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      left: Math.random() * 100, // random percentage across width
      delay: Math.random() * 1.5, // random animation delay
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3500);
  };

  const toggleTask = (id: string) => {
    if (completedTasks.includes(id)) {
      setCompletedTasks((prev) => prev.filter((t) => t !== id));
    } else {
      setCompletedTasks((prev) => [...prev, id]);
    }
  };

  const isQuizCorrect =
    mission && selectedOption !== null && selectedOption === mission.quiz.correct_option_index;

  const canComplete = mission && completedTasks.length === mission.tasks.length && isQuizCorrect;

  if (isRoadmapLoading || isProgressLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
        <p>Loading your learning environment...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={BookOpen}
          accent="Learning Mentor"
          title="Daily Learning Missions"
          description="AI-curated daily learning, revision, quizzes, and motivation loops — habit-building built in."
        />
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/60 to-accent/10 p-10 text-center backdrop-blur glow-primary">
          <BookMarked className="mx-auto h-12 w-12 text-primary mb-3" />
          <h3 className="font-display text-2xl font-bold">You need a Growth Roadmap first</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Daily 1-hour high-impact missions can only start when you have an active roadmap ready. Please go to the Roadmap page first to generate a customized roadmap.
          </p>
          <a
            href="/roadmap"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition"
          >
            <Compass className="h-4 w-4" />
            Generate Roadmap Now
          </a>
        </div>
      </div>
    );
  }

  const isCompleted = progress?.completed_days?.includes(viewDay);

  return (
    <div className="max-w-5xl mx-auto relative px-4 pb-16">
      {/* Floating Celebration Particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute bottom-[-50px] text-3xl float-particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.char}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-10vh) scale(1.2);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-105vh) scale(0.8);
            opacity: 0;
          }
        }
        .float-particle {
          animation: floatUp 3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      <PageHeader
        icon={BookOpen}
        accent="Learning Mentor"
        title="Daily Learning Missions"
        description="Just 1 hour of deep learning every day. Short missions, practical steps, and daily tests."
      />

      {/* Progress Stats Summary */}
      <div className="mb-8 rounded-2xl border border-border/50 bg-card/40 p-4 md:p-6 backdrop-blur flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-xp/10 text-xp">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Active Streak
            </div>
            <div className="text-xl font-bold flex items-center gap-1.5">
              {progress?.completed_days?.length || 0} Days Completed
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Day {progress?.current_day || 1} Active
              </span>
            </div>
          </div>
        </div>

        {/* Day selection pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDay((d) => Math.max(1, d - 1))}
            disabled={viewDay <= 1}
            className="p-2 rounded-lg border border-border bg-background/50 hover:bg-muted disabled:opacity-40"
            title="Previous Day"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-medium px-3 text-sm">
            Viewing: <strong className="text-primary">Day {viewDay}</strong>
          </span>
          <button
            onClick={() => setViewDay((d) => d + 1)}
            disabled={viewDay >= (progress?.current_day || 1) && !isCompleted}
            className="p-2 rounded-lg border border-border bg-background/50 hover:bg-muted disabled:opacity-40"
            title="Next Day"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isMissionLoading && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-border/40 bg-card/20 backdrop-blur">
          <RefreshCw className="h-10 w-10 animate-spin text-accent mb-4" />
          <h4 className="font-display text-lg font-semibold">Creating Day {viewDay} Mission...</h4>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center px-4">
            AI is checking your roadmap milestones to write customized step-by-step tasks, IDE
            configurations, and quizzes.
          </p>
        </div>
      )}

      {isMissionError && (
        <div className="text-center py-12 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h4 className="font-display text-lg font-bold">Failed to load learning mission</h4>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Kuch takneeki kharabi aayi. Please check your internet or try again.
          </p>
          <button
            onClick={() => refetchMission()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Retry Generation
          </button>
        </div>
      )}

      {mission && !isMissionLoading && (
        <div className="space-y-8">
          {/* Mission Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 md:p-8 backdrop-blur shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-15">
              <Compass className="h-24 w-24 text-primary" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-xp text-primary-foreground">
                MISSION DAY {mission.day}
              </span>
              {isCompleted ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                  <Flame className="h-3 w-3 animate-pulse" /> Pending Practice
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-aurora">
              {mission?.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-3xl leading-relaxed">
              <strong>Focus Concept:</strong> {mission.focusTopic}
            </p>

            {mission.motivation_quote && (
              <div className="mt-6 border-l-2 border-primary/40 pl-4 italic text-sm text-muted-foreground bg-primary/5 py-2 pr-2 rounded-r-lg">
                "{mission.motivation_quote}"
              </div>
            )}
          </div>

          {/* IDE & Environments Setup Section */}
          <div className="rounded-2xl border border-border bg-card/30 backdrop-blur p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Laptop className="h-5 w-5 text-accent" />
              <h3 className="font-display text-lg font-bold">Dev Setup & Required Tools</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-border/60 pb-4 md:pb-0 md:pr-6 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Recommended IDE
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-primary font-bold">
                    <Code className="h-4 w-4" />
                    {mission.ide_and_tools.recommended_ide || "VS Code"}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Prerequisites
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mission.ide_and_tools.required_tools.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Step-By-Step Setup Guidance
                </span>
                <ul className="space-y-1.5">
                  {mission.ide_and_tools.setup_steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="text-xs md:text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="font-bold text-accent shrink-0 mt-0.5">[{idx + 1}]</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive 60-Minute Timeline Slider */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              60-Minute Time Breakdown (Click to View Steps)
            </h3>

            {/* Visual Segments */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl border border-border bg-background/50">
              {mission.time_breakdown.map((item, idx) => {
                const isActive = activeSegmentIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSegmentIdx(idx)}
                    className={`rounded-lg p-3 text-center transition flex flex-col items-center justify-center gap-0.5 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                        : "bg-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {item.duration_minutes} Mins
                    </span>
                    <span className="text-xs font-semibold line-clamp-1 truncate w-full text-center">
                      {item.activity}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Segment Detail Card */}
            <div className="rounded-2xl border border-primary/20 bg-card/60 p-5 md:p-6 backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                  Step {activeSegmentIdx + 1} of 3
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Duration: {mission.time_breakdown[activeSegmentIdx].duration_minutes} Minutes
                </span>
              </div>
              <h4 className="font-display text-lg font-bold text-aurora mb-2">
                {mission.time_breakdown[activeSegmentIdx].activity}
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 font-medium leading-relaxed">
                {mission.time_breakdown[activeSegmentIdx].description}
              </p>

              <div className="border-t border-border/50 pt-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent block">
                  Detailed Instruction & Code to Try:
                </span>
                <div className="rounded-xl bg-background/80 border border-border/60 p-4 font-mono text-xs text-emerald-400 whitespace-pre-wrap overflow-x-auto leading-relaxed max-w-full">
                  {mission.time_breakdown[activeSegmentIdx].step_by_step_instruction}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Beginner Tasks Checklist */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Tasks Checklist (Complete All to Finish)
            </h3>

            <div className="grid gap-3">
              {mission.tasks.map((task) => {
                const isChecked = completedTasks.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer rounded-xl border p-4 backdrop-blur transition flex items-start gap-4 ${
                      isChecked
                        ? "border-emerald-500/40 bg-emerald-500/5 glow-emerald"
                        : "border-border bg-card/40 hover:border-border/80"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "border-border bg-background"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4
                        className={`text-sm font-semibold transition-colors ${isChecked ? "text-emerald-400 line-through" : "text-foreground"}`}
                      >
                        {task?.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <FormatText text={task.description} />
                      </p>
                      {task.hint && (
                        <div className="text-[11px] text-accent font-mono flex items-center gap-1 mt-1">
                          <Info className="h-3 w-3 shrink-0" />
                          <span>Hint: {task.hint}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Concept Quiz Check */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold">Concept Check Quiz</h3>
            </div>

            <p className="text-sm font-medium leading-relaxed text-foreground">
              {mission.quiz.question}
            </p>

            <div className="grid gap-2">
              {mission.quiz.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const showSuccess = quizSubmitted && idx === mission.quiz.correct_option_index;
                const showFailure =
                  quizSubmitted && isSelected && idx !== mission.quiz.correct_option_index;

                return (
                  <button
                    key={idx}
                    disabled={quizSubmitted && idx === mission.quiz.correct_option_index}
                    onClick={() => {
                      setSelectedOption(idx);
                      setQuizSubmitted(true);
                    }}
                    className={`text-left p-4 rounded-xl border transition flex items-center justify-between gap-3 ${
                      showSuccess
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                        : showFailure
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/40 hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs md:text-sm">{option}</span>
                    <div className="shrink-0">
                      {showSuccess && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-bold">
                          CORRECT
                        </span>
                      )}
                      {showFailure && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500 text-white font-bold">
                          INCORRECT
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="mt-3 p-4 rounded-xl bg-background/50 border border-border text-xs md:text-sm text-muted-foreground leading-relaxed">
                <strong
                  className={
                    isQuizCorrect ? "text-emerald-400 block mb-1" : "text-red-400 block mb-1"
                  }
                >
                  {isQuizCorrect ? "Absolutely Correct! ✨" : "Wrong Answer! Keep trying."}
                </strong>
                {mission.quiz.explanation}
              </div>
            )}
          </div>

          {/* XP Claim and Advance Action Panel */}
          <div className="p-1 rounded-3xl bg-gradient-to-r from-primary via-aurora to-accent glow-primary">
            <div className="rounded-[22px] bg-background p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-xp/10 flex items-center justify-center text-xp">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">
                Ready to complete Day {mission.day}?
              </h3>
              <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                Complete all tasks for Day {mission.day} and answer the quiz correctly to claim your +50 XP reward and move on to the next day!
              </p>

              <button
                onClick={() => completeMutation.mutate()}
                disabled={!canComplete || completeMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed glow-primary"
              >
                {completeMutation.isPending ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {isCompleted ? "Day Re-complete & Next Session" : "Complete Mission & Claim 50 XP"}
              </button>

              {!canComplete && !isCompleted && (
                <p className="text-[11px] text-amber-400">
                  * Complete the checklist for all tasks and answer the Quiz correctly (Green success
                  state).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
