import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    // Firebase sends the reset code in the oobCode query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("oobCode");
    if (code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then(() => setReady(true))
        .catch(() => toast.error("Invalid or expired reset link."));
    } else {
      toast.error("No reset code found in URL.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password kam se kam 6 characters ka ho");
    if (password !== confirm) return toast.error("Passwords match nahi ho rahe");
    if (!oobCode) return toast.error("Reset code missing");

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Password update ho gaya!");
      navigate({ to: "/auth" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cosmos flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 border border-primary/30 glow-primary">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-2xl font-bold">RaahAI</span>
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur">
          <h1 className="text-xl font-semibold">Naya password set karein</h1>
          {!ready ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Reset link verify ho raha hai... agar page atka rahe, apne email ka reset link dobara
              open karein.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rp-pw">New password</Label>
                <Input
                  id="rp-pw"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-pw2">Confirm password</Label>
                <Input
                  id="rp-pw2"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full glow-primary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
