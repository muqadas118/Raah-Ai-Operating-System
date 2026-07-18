import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { User, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [focus, setFocus] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const docSnap = await getDoc(doc(db, "profiles", user.uid));
      return docSnap.exists() ? docSnap.data() : null;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setFocus(profile.current_focus ?? "");

      // If a draft exists, restore it as well
      const user = auth.currentUser;
      if (user) {
        const saved = localStorage.getItem(`profile-draft-${user.uid}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.fullName !== undefined) setFullName(parsed.fullName);
            if (parsed.username !== undefined) setUsername(parsed.username);
            if (parsed.bio !== undefined) setBio(parsed.bio);
            if (parsed.focus !== undefined) setFocus(parsed.focus);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [profile]);

  // Save draft whenever inputs change
  useEffect(() => {
    const user = auth.currentUser;
    if (user && (fullName || username || bio || focus)) {
      localStorage.setItem(
        `profile-draft-${user.uid}`,
        JSON.stringify({ fullName, username, bio, focus }),
      );
    }
  }, [fullName, username, bio, focus]);

  const save = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");
      await updateDoc(doc(db, "profiles", user.uid), {
        full_name: fullName,
        username: username || null,
        bio,
        current_focus: focus,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      const user = auth.currentUser;
      if (user) {
        localStorage.removeItem(`profile-draft-${user.uid}`);
      }
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Aapko feedback bhejne ke liye login hona zaroori hai.");
      if (feedbackRating === 0) throw new Error("Kuch toh stars select karein!");
      
      await addDoc(collection(db, "feedbacks"), {
        userId: user.uid,
        userEmail: user.email || null,
        userName: fullName || user.displayName || "Anonymous",
        rating: feedbackRating,
        comment: feedbackComment,
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Shukriya! Aapka feedback record kar liya gaya hai.");
      setFeedbackRating(0);
      setFeedbackComment("");
    },
    onError: (e: Error) => {
      toast.error(`Feedback send karne me masla hua: ${e.message}`);
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <PageHeader
          icon={User}
          accent="Your Profile"
          title="Who is RaahAI helping?"
          description="Yeh info AI ko personalize karti hai — jitna specific, utna better guidance."
        />
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur space-y-5">
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@yourhandle"
                />
              </div>
              <div className="space-y-2">
                <Label>Current focus</Label>
                <Input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. Full-stack + Product"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Aap kaun ho, kya seekh rahe ho, kahan jaana chahte ho…"
                />
              </div>
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="glow-primary"
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur space-y-5">
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500/20" />
          <div>
            <h3 className="text-lg font-semibold font-sans tracking-tight text-foreground">App Feedback & Rating</h3>
            <p className="text-sm text-muted-foreground">RaahAI ke baare mein apna tajurba share karein aur isse mazeed behtar banayein.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rating (Stars)</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || feedbackRating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30 fill-transparent"
                    }`}
                  />
                </button>
              ))}
              {feedbackRating > 0 && (
                <span className="text-sm font-mono text-muted-foreground ml-2">
                  ({feedbackRating} / 5)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Aapka Feedback</Label>
            <Textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              rows={3}
              placeholder="Aapko kya pasand aaya? Hum isko kaise aur behtar bana sakte hain?..."
            />
          </div>

          <Button
            onClick={() => submitFeedback.mutate()}
            disabled={submitFeedback.isPending}
            className="glow-primary w-full sm:w-auto"
          >
            {submitFeedback.isPending ? "Submitting..." : "Feedback Submit Karein"}
          </Button>
        </div>
      </div>
    </div>
  );
}
