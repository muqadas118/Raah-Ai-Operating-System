import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: string;
}

export function PageHeader({ icon: Icon, title, description, accent }: Props) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 border border-primary/30 text-primary glow-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        {accent && (
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-accent">
            {accent}
          </div>
        )}
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
      </div>
    </div>
  );
}

export function ComingSoonCard({ features }: { features: string[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 backdrop-blur">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> In development
      </div>
      <h3 className="font-display text-xl font-semibold mb-3">Kya aayega yahan:</h3>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
