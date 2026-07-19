import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { LayoutDashboard, Dna, Flame, Trophy, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const docSnap = await getDoc(doc(db, "profiles", user.uid));
      return docSnap.exists() ? docSnap.data() : null;
    },
  });

  const { data: dna } = useQuery({
    queryKey: ["growth_dna"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const docSnap = await getDoc(doc(db, "growth_dna", user.uid));
      return docSnap.exists() ? docSnap.data() : null;
    },
  });

  const name = profile?.full_name?.split(" ")[0] || "there";

  const stats = [
    { label: "XP", value: profile?.xp ?? 0, icon: Trophy, color: "text-xp" },
    { label: "Level", value: profile?.level ?? 1, icon: TrendingUp, color: "text-primary" },
    { label: "Streak", value: `${profile?.streak_days ?? 0}d`, icon: Flame, color: "text-accent" },
    {
      label: "DNA Level",
      value: dna?.overall_level ?? "Explorer",
      icon: Dna,
      color: "text-aurora",
    },
  ];

  const dnaScores = [
    { label: "Technical", value: dna?.technical_score ?? 0 },
    { label: "Leadership", value: dna?.leadership_score ?? 0 },
    { label: "Networking", value: dna?.networking_score ?? 0 },
    { label: "Creativity", value: dna?.creativity_score ?? 0 },
    { label: "Discipline", value: dna?.discipline_score ?? 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back, ${name}`}
        description="This is your growth cockpit. Track your progress across modules and get personalized guidance from RaahAI."
        accent="Home"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* DNA quick view */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Your Growth DNA</h3>
              <p className="text-sm text-muted-foreground">5 axes of your growth signature</p>
            </div>
            <Link to="/growth-dna" className="text-sm text-accent hover:underline">
              Details →
            </Link>
          </div>
          <div className="space-y-3">
            {dnaScores.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground">{s.value}/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-aurora to-accent transition-all"
                    style={{ width: `${Math.max(4, s.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {profile?.onboarded ? (
          <div className="rounded-2xl border border-aurora/30 bg-gradient-to-br from-aurora/20 via-card to-accent/10 p-6 backdrop-blur glow-aurora">
            <Target className="h-6 w-6 text-aurora mb-3" />
            <h3 className="font-display text-lg font-semibold">Growth DNA Calibrated!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your DNA assessment is complete. Keep tracking your learning timeline and active resume projects.
            </p>
            <Link
              to="/roadmap"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open Roadmap →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-accent/10 p-6 backdrop-blur glow-primary">
            <Target className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-display text-lg font-semibold">Take the Growth DNA Assessment</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover your true growth signature and unlock your personalized roadmap.
            </p>
            <Link
              to="/growth-dna"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Start Assessment →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
