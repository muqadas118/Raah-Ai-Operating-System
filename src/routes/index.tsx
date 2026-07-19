import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass, Dna, Rocket, Network, Trophy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const modules = [
  { icon: Dna, title: "Living Growth DNA", desc: "5-axis skill map that evolves with you." },
  { icon: Compass, title: "Raahbar AI Copilot", desc: "Personal AI mentor guiding you every day." },
  { icon: Rocket, title: "Dynamic Roadmap", desc: "90-day adaptive roadmap based on your DNA." },
  {
    icon: Network,
    title: "Networking Coach",
    desc: "LinkedIn, Discord, cold outreach — all covered.",
  },
  {
    icon: Trophy,
    title: "Opportunity Scout",
    desc: "Hackathons, jobs, scholarships auto-detected.",
  },
  { icon: Sparkles, title: "Project Forge", desc: "AI-recommended projects that build your portfolio." },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate({ to: "/dashboard" });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cosmos">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 border border-primary/30 glow-primary">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">RaahAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="glow-primary">
              Get started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Not another AI chatbot
        </div>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          Your AI-powered <br />
          <span className="text-aurora">Growth Operating System</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          RaahAI continuously understands, tracks, and accelerates your learning, networking,
          career, and professional development through a{" "}
          <span className="text-foreground font-medium">living Growth DNA</span>.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="glow-primary gap-2">
              Start your Growth DNA <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Watch how it works
          </Button>
        </div>
      </section>

      {/* Modules grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            One OS. <span className="text-aurora">Every growth module.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Chat, learn, network, manage projects, and discover opportunities — all in one place.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div
              key={m.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur transition-all hover:border-primary/50 hover:bg-card/80"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-accent/10 p-10 text-center glow-primary">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Your growth story starts here
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sign up, generate your Growth DNA, and let RaahAI handle the rest.
          </p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RaahAI — A lifelong growth OS.
      </footer>
    </div>
  );
}
