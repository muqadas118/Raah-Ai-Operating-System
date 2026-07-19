import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Brain,
  Activity,
  Zap,
  Users,
  Loader2,
  Trophy,
  Compass,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ActivityLog {
  id?: string;
  user_id: string;
  type?: string;
  title: string;
  description?: string;
  xp_earned?: number;
  xp_gained?: number;
  created_at: string;
}

interface ProfileData {
  id: string;
  full_name?: string;
  username?: string;
  bio?: string;
  current_focus?: string;
  xp?: number;
  level?: number;
}

interface DnaData {
  user_id: string;
  technical_score?: number;
  leadership_score?: number;
  networking_score?: number;
  creativity_score?: number;
  discipline_score?: number;
  overall_level?: string;
}

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function calculateStreak(activities: ActivityLog[]): number {
  if (!activities || activities.length === 0) return 0;

  // Extract unique active dates in local/UTC format YYYY-MM-DD
  const dates = Array.from(
    new Set(
      activities
        .map((a) => {
          if (!a.created_at) return null;
          return a.created_at.split("T")[0];
        })
        .filter((d): d is string => d !== null)
    )
  ).sort() as string[]; // oldest to newest

  if (dates.length === 0) return 0;

  // Check if latest date is today or yesterday to ensure the streak is still active
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const latestDate = dates[dates.length - 1];
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return 0; // Streak is broken
  }

  let streak = 1;
  for (let i = dates.length - 2; i >= 0; i--) {
    const d1 = new Date(dates[i + 1]);
    const d2 = new Date(dates[i]);
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      break; // Gap detected, stop counting
    }
  }
  return streak;
}

function AnalyticsPage() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics_dashboard_data", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      if (!currentUser) return null;

      // 1. Fetch user profile
      const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
      const profile = (
        profileSnap.exists()
          ? { id: currentUser.uid, ...profileSnap.data() }
          : { id: currentUser.uid, xp: 0, level: 1 }
      ) as ProfileData;

      // 2. Fetch user's Growth DNA
      const dnaQ = query(
        collection(db, "growth_dna"),
        where("user_id", "==", currentUser.uid)
      );
      const dnaSnap = await getDocs(dnaQ);
      const dna = (
        !dnaSnap.empty ? dnaSnap.docs[0].data() : null
      ) as DnaData | null;

      // 3. Fetch user activities
      const actQ = query(
        collection(db, "activities"),
        where("user_id", "==", currentUser.uid)
      );
      const actSnap = await getDocs(actQ);
      const activities = actSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActivityLog[];

      // Sort activities newest first for streak or listing
      activities.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

      // 4. Fetch Peer Leaderboard (Top 5 users by XP)
      const leaderboardQ = query(
        collection(db, "profiles"),
        orderBy("xp", "desc"),
        limit(5)
      );
      const leaderboardSnap = await getDocs(leaderboardQ);
      const leaderboard = leaderboardSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ProfileData[];

      return {
        profile,
        dna,
        activities,
        leaderboard,
      };
    },
  });

  if (isLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Compiling your real-time performance analytics...
        </p>
      </div>
    );
  }

  const { profile, dna, activities = [], leaderboard = [] } = analyticsData || {};

  // Calculate Streak
  const streakDays = calculateStreak(activities);

  // Parse DNA radar axis values
  const dnaRadarData = dna
    ? [
        { axis: "Technical", value: dna.technical_score ?? 0 },
        { axis: "Leadership", value: dna.leadership_score ?? 0 },
        { axis: "Networking", value: dna.networking_score ?? 0 },
        { axis: "Creativity", value: dna.creativity_score ?? 0 },
        { axis: "Discipline", value: dna.discipline_score ?? 0 },
      ]
    : [];

  // Parse Activity log in the last 7 days
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activityData: { day: string; activity: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];

    const count = activities.filter((a) => {
      if (!a.created_at) return false;
      return a.created_at.split("T")[0] === dateStr;
    }).length;

    activityData.push({ day: dayName, activity: count });
  }

  // Parse Weekly Growth XP over the last 4 weeks
  const now = new Date();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const weekTotals = [0, 0, 0, 0]; // 3 weeks ago, 2 weeks ago, 1 week ago, this week

  activities.forEach((a) => {
    if (!a.created_at) return;
    const ageMs = now.getTime() - new Date(a.created_at).getTime();
    const weeksAgo = Math.floor(ageMs / oneWeekMs);
    if (weeksAgo >= 0 && weeksAgo < 4) {
      weekTotals[3 - weeksAgo] +=
        Number(a.xp_earned) || Number(a.xp_gained) || 10;
    }
  });

  const currentXp = profile?.xp ?? 0;
  const userLevel = profile?.level ?? 1;
  const nextLevelXp = userLevel * 500;
  const prevLevelXp = (userLevel - 1) * 500;
  const currentLevelProgress = currentXp - prevLevelXp;
  const progressPercent = Math.max(
    0,
    Math.min(100, (currentLevelProgress / 500) * 100)
  );

  const growthTrendData = [
    { name: "3w Ago", growth: Math.max(0, currentXp - weekTotals[1] - weekTotals[2] - weekTotals[3]) },
    { name: "2w Ago", growth: Math.max(0, currentXp - weekTotals[2] - weekTotals[3]) },
    { name: "1w Ago", growth: Math.max(0, currentXp - weekTotals[3]) },
    { name: "Current", growth: currentXp },
  ];

  // Dynamic Focus Insight Generation
  let lowestDimension = "DNA Assessment";
  let lowestScore = 101;
  let dynamicTip = "Complete your Growth DNA to receive personalized developer roadmap tips.";

  if (dna) {
    const dimensions = [
      { name: "Technical", score: dna.technical_score ?? 0 },
      { name: "Leadership", score: dna.leadership_score ?? 0 },
      { name: "Networking", score: dna.networking_score ?? 0 },
      { name: "Creativity", score: dna.creativity_score ?? 0 },
      { name: "Discipline", score: dna.discipline_score ?? 0 },
    ];
    dimensions.sort((a, b) => a.score - b.score);
    lowestDimension = dimensions[0].name;
    lowestScore = dimensions[0].score;

    if (lowestDimension === "Technical") {
      dynamicTip = "Forge advanced portfolio projects in the Project Forge section to elevate your engineering credentials.";
    } else if (lowestDimension === "Leadership") {
      dynamicTip = "Take active roles in team conflict scenarios. Review leadership frameworks and practice live case studies.";
    } else if (lowestDimension === "Networking") {
      dynamicTip = "Populate your Networking contacts CRM and execute professional follow-ups to expand your reach.";
    } else if (lowestDimension === "Creativity") {
      dynamicTip = "Brainstorm unconventional architectures or features for your existing milestones and pitch them to Raahbar.";
    } else {
      dynamicTip = "Complete consecutive daily missions and study goals to cultivate world-class consistency.";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader
        icon={BarChart3}
        accent="Real-time Performance"
        title="Live Growth Analytics"
        description="A live, daily-updating telemetry of your development metrics, active streaks, skill distributions, and community rank."
      />

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experience Points Progress */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">Level {userLevel} Builder</span>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{currentXp} XP</div>
            <p className="text-xs text-muted-foreground mb-4">
              {500 - currentLevelProgress} XP remaining until Level {userLevel + 1}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-muted" />
          </div>
        </div>

        {/* Realtime Streak Counter */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">Active Daily Streak</span>
              <Zap className={`h-5 w-5 ${streakDays > 0 ? "text-orange-500 animate-bounce" : "text-muted-foreground"}`} />
            </div>
            <div className="text-4xl font-bold mb-1">{streakDays} {streakDays === 1 ? "Day" : "Days"}</div>
            <p className="text-xs text-muted-foreground">
              {streakDays > 0
                ? "Excellent consistency! Keep up the daily learning cycle."
                : "Log an activity today to start your daily streak!"}
            </p>
          </div>
          <div className="text-xs font-medium text-primary flex items-center gap-1 mt-4">
            <CheckCircle className="h-4 w-4" /> Streak updates automatically each calendar day
          </div>
        </div>

        {/* Actionable Focus / AI Advice */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">Priority Growth Focus</span>
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              Optimize {lowestDimension}
              {lowestScore < 101 && (
                <span className="text-xs font-normal text-destructive-foreground bg-destructive/30 px-2 py-0.5 rounded-full">
                  Score: {lowestScore}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {dynamicTip}
            </p>
          </div>
          <div className="mt-4">
            <Button size="sm" variant="outline" className="w-full text-xs" asChild>
              <Link to={lowestDimension === "DNA Assessment" ? "/growth-dna" : lowestDimension === "Technical" ? "/projects" : lowestDimension === "Networking" ? "/networking" : "/learning"}>
                Accelerate Growth <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trend (Cumulative XP over time) */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cumulative Growth Curve
            </h3>
            <p className="text-xs text-muted-foreground">
              Your overall experience accumulation plotted over the past 4 weeks.
            </p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} stroke="#374151" />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} stroke="#374151" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                  labelStyle={{ color: "#ffffff" }}
                />
                <Line
                  type="monotone"
                  dataKey="growth"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Heatmap / DNA Radar */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Brain className="h-5 w-5 text-primary" />
              Skill DNA Radar
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct mapping of your strengths and competencies from your Growth DNA profile.
            </p>
          </div>
          <div className="h-[220px] flex items-center justify-center">
            {!dna ? (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed border-border w-full h-full">
                <Brain className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                <h4 className="font-semibold text-xs mb-1">Growth DNA Pending</h4>
                <p className="text-[11px] text-muted-foreground max-w-xs mb-3">
                  Complete your Growth DNA assessment to unlock the skill radar heatmap.
                </p>
                <Button size="xs" className="h-7 px-3 text-xs" asChild>
                  <Link to="/growth-dna">Take Assessment</Link>
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dnaRadarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 9 }} stroke="#374151" />
                  <Radar
                    name="Growth DNA"
                    dataKey="value"
                    stroke="#818cf8"
                    fill="#818cf8"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Activity Frequency Chart */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Activity className="h-5 w-5 text-primary" />
              Daily Activity Telemetry
            </h3>
            <p className="text-xs text-muted-foreground">
              Count of completed development tasks, submissions, or evaluations over the last 7 days.
            </p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} stroke="#374151" />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} stroke="#374151" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                  labelStyle={{ color: "#ffffff" }}
                />
                <Bar dataKey="activity" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peer Leaderboards */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Users className="h-5 w-5 text-primary" />
                Peer Leaderboards
              </h3>
              <p className="text-xs text-muted-foreground">
                The top builders and minds inside the RaahAI environment.
              </p>
            </div>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-xs text-muted-foreground p-4 text-center">
                  No other active builders registered yet. You are leading the charge!
                </div>
              ) : (
                leaderboard.map((item, index) => {
                  const isSelf = item.id === currentUser.uid;
                  return (
                    <div
                      key={item.id || index}
                      className={`flex items-center justify-between p-2.5 rounded-xl border ${
                        isSelf
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/10 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            {item.full_name || "Anonymous Builder"}
                            {isSelf && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full font-normal">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            @{item.username || "builder"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-primary">
                          {item.xp ?? 0} XP
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Lvl {item.level ?? 1}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground text-center mt-4">
            Consistency determines your dynamic real-time leaderboard standing.
          </div>
        </div>
      </div>
    </div>
  );
}
