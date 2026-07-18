import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dna, ChevronLeft, ChevronRight, Check, Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/growth-dna")({
  component: GrowthDNAPage,
});

type QType = "radio" | "checkbox" | "dropdown" | "text" | "scale";
type Question = {
  id: string;
  label: string;
  help?: string;
  type: QType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  max?: number; // for checkbox limit
  axis?: "technical" | "leadership" | "networking" | "creativity" | "discipline";
  weight?: number; // score contribution
  scoreMap?: Record<string, number>; // for radio/dropdown
};

type Section = { key: string; title: string; subtitle: string; questions: Question[] };

// --- Question catalog: rich, varied, covers everything ---
const SECTIONS: Section[] = [
  {
    key: "about",
    title: "About You",
    subtitle: "Basic info taake RaahAI aapko personally samajh sake.",
    questions: [
      {
        id: "full_name",
        label: "Aapka full name?",
        type: "text",
        placeholder: "e.g. Ahmed Khan",
        required: true,
      },
      {
        id: "age_range",
        label: "Age range?",
        type: "dropdown",
        required: false,
        options: ["Under 18", "18-22", "23-27", "28-32", "33-40", "40+"],
      },
      {
        id: "country",
        label: "Country / City?",
        type: "text",
        placeholder: "e.g. Lahore, Pakistan",
        required: false,
      },
      {
        id: "languages",
        label: "Languages aapko aati hain? (multiple)",
        type: "checkbox",
        options: ["Urdu", "English", "Hindi", "Punjabi", "Arabic", "Pashto", "Sindhi", "Other"],
      },
      {
        id: "education",
        label: "Highest education?",
        type: "dropdown",
        required: false,
        options: [
          "Matric / O-Levels",
          "Intermediate / A-Levels",
          "Bachelor's (in progress)",
          "Bachelor's (done)",
          "Master's",
          "PhD",
          "Self-taught",
        ],
      },
      {
        id: "field",
        label: "Field of study / expertise?",
        type: "text",
        placeholder: "e.g. Computer Science, Business, Design",
      },
    ],
  },
  {
    key: "career",
    title: "Career Status",
    subtitle: "Aap abhi kahan ho aur kahan jaana hai.",
    questions: [
      {
        id: "status",
        label: "Current status?",
        type: "radio",
        required: false,
        options: [
          "Student",
          "Job dhoond raha/rahi hoon",
          "Working professional",
          "Freelancer",
          "Founder / Entrepreneur",
          "Career switch kar raha/rahi hoon",
        ],
      },
      {
        id: "experience",
        label: "Years of professional experience?",
        type: "dropdown",
        required: false,
        options: ["0 (student)", "0-1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"],
        axis: "technical",
        weight: 15,
        scoreMap: {
          "0 (student)": 2,
          "0-1 year": 5,
          "1-3 years": 8,
          "3-5 years": 11,
          "5-10 years": 13,
          "10+ years": 15,
        },
      },
      {
        id: "industry",
        label: "Industry / domain?",
        type: "dropdown",
        options: [
          "Software / Tech",
          "Design / Creative",
          "Business / Finance",
          "Marketing / Sales",
          "Content / Media",
          "Education",
          "Healthcare",
          "Engineering",
          "Other",
        ],
      },
      {
        id: "target_role",
        label: "Next 12 months mein aap kaunsa role/goal chahte ho?",
        type: "text",
        placeholder: "e.g. Full-stack developer at a product company",
        required: false,
      },
      {
        id: "timeline",
        label: "Aap kitni jaldi ye goal achieve karna chahte ho?",
        type: "radio",
        options: ["3 months", "6 months", "1 year", "2+ years", "Abhi decide nahi kiya"],
      },
    ],
  },
  {
    key: "technical",
    title: "Technical Skills",
    subtitle: "Skills, tools aur proficiency.",
    questions: [
      {
        id: "tech_skills",
        label: "Konsi technical skills aati hain? (jitni bhi lagen)",
        type: "checkbox",
        axis: "technical",
        weight: 40,
        options: [
          "Web Dev (Frontend)",
          "Web Dev (Backend)",
          "Mobile Dev",
          "AI / ML",
          "Data Science",
          "DevOps / Cloud",
          "UI / UX Design",
          "Graphic Design",
          "Video Editing",
          "Content Writing",
          "SEO / Marketing",
          "Product Management",
          "Sales",
          "Public Speaking",
          "None yet",
        ],
      },
      {
        id: "primary_stack",
        label: "Primary tools / stack? (jo sabse zyada use karte ho)",
        type: "text",
        placeholder: "e.g. React, Node.js, Figma, Python",
      },
      {
        id: "self_rating",
        label: "Apni technical proficiency kaisi rate karoge?",
        type: "scale",
        axis: "technical",
        weight: 25,
        options: ["1 - Beginner", "2", "3 - Intermediate", "4", "5 - Expert"],
        scoreMap: { "1 - Beginner": 5, "2": 10, "3 - Intermediate": 15, "4": 20, "5 - Expert": 25 },
      },
      {
        id: "projects_built",
        label: "Kitne real projects/products build kiye hain?",
        type: "dropdown",
        axis: "technical",
        weight: 20,
        options: ["0", "1-2", "3-5", "6-10", "10+"],
        scoreMap: { "0": 0, "1-2": 6, "3-5": 12, "6-10": 17, "10+": 20 },
      },
      {
        id: "certifications",
        label: "Koi certifications / notable achievements?",
        type: "text",
        placeholder: "e.g. AWS Certified, Google UX, hackathon winner",
      },
    ],
  },
  {
    key: "leadership",
    title: "Leadership",
    subtitle: "Team, ownership aur decision-making style.",
    questions: [
      {
        id: "led_team",
        label: "Kabhi team lead ki hai?",
        type: "radio",
        required: false,
        axis: "leadership",
        weight: 25,
        options: ["Never", "Small group project", "Team of 2-5", "Team of 5-15", "15+ people"],
        scoreMap: {
          Never: 0,
          "Small group project": 8,
          "Team of 2-5": 15,
          "Team of 5-15": 22,
          "15+ people": 25,
        },
      },
      {
        id: "leader_traits",
        label: "Apni leadership strength kya hai? (multiple)",
        type: "checkbox",
        axis: "leadership",
        weight: 20,
        options: [
          "Vision setting",
          "Delegation",
          "Conflict resolution",
          "Mentoring",
          "Public speaking",
          "Decision-making under pressure",
          "None yet",
        ],
      },
      {
        id: "ownership",
        label: "Ownership level: jab problem aati hai to?",
        type: "radio",
        axis: "leadership",
        weight: 20,
        options: [
          "Wait for someone else to solve",
          "Report it and move on",
          "Try to solve if it's my area",
          "Take charge and fix it end-to-end",
        ],
        scoreMap: {
          "Wait for someone else to solve": 3,
          "Report it and move on": 8,
          "Try to solve if it's my area": 15,
          "Take charge and fix it end-to-end": 20,
        },
      },
      {
        id: "mentored",
        label: "Kisi ko mentor kiya hai?",
        type: "radio",
        axis: "leadership",
        weight: 15,
        options: ["Never", "Informally 1-2 log", "Regularly 3-5 log", "10+ people over time"],
        scoreMap: {
          Never: 0,
          "Informally 1-2 log": 6,
          "Regularly 3-5 log": 11,
          "10+ people over time": 15,
        },
      },
      {
        id: "decision_style",
        label: "Decision making style?",
        type: "radio",
        axis: "leadership",
        weight: 20,
        options: [
          "Data ke baghair decide nahi karta",
          "Data + gut mix",
          "Mostly gut / intuition",
          "Depends on situation",
        ],
        scoreMap: {
          "Data ke baghair decide nahi karta": 15,
          "Data + gut mix": 20,
          "Mostly gut / intuition": 10,
          "Depends on situation": 17,
        },
      },
    ],
  },
  {
    key: "networking",
    title: "Networking & Presence",
    subtitle: "Log aapko kitna jaante hain, aap logon tak kitna pohanchte ho.",
    questions: [
      {
        id: "linkedin_size",
        label: "LinkedIn connections?",
        type: "dropdown",
        axis: "networking",
        weight: 20,
        options: ["No LinkedIn", "< 100", "100-500", "500-1500", "1500-5000", "5000+"],
        scoreMap: {
          "No LinkedIn": 0,
          "< 100": 4,
          "100-500": 9,
          "500-1500": 14,
          "1500-5000": 18,
          "5000+": 20,
        },
      },
      {
        id: "events",
        label: "Last 6 months mein kitne events/meetups attend kiye?",
        type: "dropdown",
        axis: "networking",
        weight: 15,
        options: ["0", "1-2", "3-5", "6-10", "10+"],
        scoreMap: { "0": 0, "1-2": 5, "3-5": 10, "6-10": 13, "10+": 15 },
      },
      {
        id: "outreach_comfort",
        label: "Cold outreach (DM / email) karne mein kitna comfort hai?",
        type: "scale",
        axis: "networking",
        weight: 20,
        options: [
          "1 - Bilkul nahi kar sakta",
          "2",
          "3 - Kabhi kabhi",
          "4",
          "5 - Regular karta hoon",
        ],
        scoreMap: {
          "1 - Bilkul nahi kar sakta": 3,
          "2": 8,
          "3 - Kabhi kabhi": 13,
          "4": 17,
          "5 - Regular karta hoon": 20,
        },
      },
      {
        id: "community",
        label: "Kis community / platform pe active ho? (multiple)",
        type: "checkbox",
        axis: "networking",
        weight: 15,
        options: [
          "LinkedIn",
          "Twitter / X",
          "GitHub",
          "Discord",
          "Reddit",
          "Local meetups",
          "Slack communities",
          "None",
        ],
      },
      {
        id: "content_share",
        label: "Publicly kuch share karte ho? (posts, threads, videos)",
        type: "radio",
        axis: "networking",
        weight: 15,
        options: ["Never", "Sometimes (monthly)", "Weekly", "Almost daily"],
        scoreMap: { Never: 0, "Sometimes (monthly)": 6, Weekly: 11, "Almost daily": 15 },
      },
      {
        id: "referrals",
        label: "Job/opportunity mein referral se help mili hai kabhi?",
        type: "radio",
        axis: "networking",
        weight: 15,
        options: ["Never", "Once", "2-3 times", "Regularly"],
        scoreMap: { Never: 0, Once: 6, "2-3 times": 11, Regularly: 15 },
      },
    ],
  },
  {
    key: "creativity",
    title: "Creativity & Problem Solving",
    subtitle: "Naya kaise sochte ho aur kaise banate ho.",
    questions: [
      {
        id: "creates",
        label: "Kya create karte ho? (multiple)",
        type: "checkbox",
        axis: "creativity",
        weight: 25,
        options: [
          "Code / Products",
          "Blogs / Articles",
          "Videos",
          "Designs / Art",
          "Music",
          "Startups / Business ideas",
          "Nothing yet",
        ],
      },
      {
        id: "novel_ideas",
        label: "Har hafte kitni naye ideas note karte ho?",
        type: "dropdown",
        axis: "creativity",
        weight: 20,
        options: ["0", "1-3", "4-7", "8-15", "15+"],
        scoreMap: { "0": 0, "1-3": 7, "4-7": 13, "8-15": 17, "15+": 20 },
      },
      {
        id: "problem_style",
        label: "Naya problem milta hai to sabse pehle?",
        type: "radio",
        axis: "creativity",
        weight: 20,
        options: [
          "Google / YouTube dekhta hoon",
          "AI se poochta hoon",
          "Khud try karta hoon phir help leta hoon",
          "First-principles se sochta hoon",
        ],
        scoreMap: {
          "Google / YouTube dekhta hoon": 8,
          "AI se poochta hoon": 10,
          "Khud try karta hoon phir help leta hoon": 16,
          "First-principles se sochta hoon": 20,
        },
      },
      {
        id: "hobbies",
        label: "Creative hobbies?",
        type: "checkbox",
        axis: "creativity",
        weight: 15,
        options: [
          "Photography",
          "Writing",
          "Drawing / Design",
          "Music / Instrument",
          "Cooking",
          "DIY / Making",
          "Gaming (creative)",
          "None",
        ],
      },
      {
        id: "risk_taking",
        label: "Risk appetite?",
        type: "scale",
        axis: "creativity",
        weight: 20,
        options: ["1 - Very safe", "2", "3 - Balanced", "4", "5 - High risk high reward"],
        scoreMap: {
          "1 - Very safe": 4,
          "2": 8,
          "3 - Balanced": 12,
          "4": 16,
          "5 - High risk high reward": 20,
        },
      },
    ],
  },
  {
    key: "discipline",
    title: "Discipline & Habits",
    subtitle: "Consistency, focus aur daily habits.",
    questions: [
      {
        id: "study_hours",
        label: "Daily productive/learning hours?",
        type: "dropdown",
        required: false,
        axis: "discipline",
        weight: 25,
        options: ["< 1 hour", "1-2 hours", "2-4 hours", "4-6 hours", "6+ hours"],
        scoreMap: {
          "< 1 hour": 5,
          "1-2 hours": 10,
          "2-4 hours": 17,
          "4-6 hours": 22,
          "6+ hours": 25,
        },
      },
      {
        id: "habits",
        label: "Kaunsi daily habits maintain karte ho? (multiple)",
        type: "checkbox",
        axis: "discipline",
        weight: 20,
        options: [
          "Exercise / Gym",
          "Reading",
          "Journaling",
          "Meditation",
          "Coding / practice",
          "Early wake-up",
          "No social media limit",
          "None",
        ],
      },
      {
        id: "streak_longest",
        label: "Longest streak (koi bhi habit) kitne din chali?",
        type: "dropdown",
        axis: "discipline",
        weight: 15,
        options: ["< 7 days", "1-4 weeks", "1-3 months", "3-6 months", "6+ months"],
        scoreMap: {
          "< 7 days": 3,
          "1-4 weeks": 7,
          "1-3 months": 11,
          "3-6 months": 13,
          "6+ months": 15,
        },
      },
      {
        id: "procrastination",
        label: "Procrastination level (1 = never, 5 = always)?",
        type: "scale",
        axis: "discipline",
        weight: 20,
        options: ["1", "2", "3", "4", "5"],
        scoreMap: { "1": 20, "2": 16, "3": 12, "4": 7, "5": 3 },
      },
      {
        id: "sleep",
        label: "Sleep schedule?",
        type: "radio",
        axis: "discipline",
        weight: 10,
        options: [
          "Very irregular",
          "Somewhat regular",
          "Mostly regular (6-8 hrs)",
          "Strict schedule, 7-8 hrs",
        ],
        scoreMap: {
          "Very irregular": 2,
          "Somewhat regular": 5,
          "Mostly regular (6-8 hrs)": 8,
          "Strict schedule, 7-8 hrs": 10,
        },
      },
      {
        id: "distraction",
        label: "Sabse bada distraction?",
        type: "radio",
        options: [
          "Social media",
          "YouTube / Netflix",
          "Games",
          "Overthinking",
          "Friends / social",
          "Kuch nahi, focused hoon",
        ],
      },
    ],
  },
  {
    key: "goals",
    title: "Goals & Preferences",
    subtitle: "Aakhri set — priorities aur learning style.",
    questions: [
      {
        id: "top_goals",
        label: "Top 3 goals next 6 months? (max 3)",
        type: "checkbox",
        max: 3,
        required: false,
        options: [
          "Land a job",
          "Get a promotion",
          "Switch career",
          "Launch a startup",
          "Build audience / brand",
          "Learn a new skill",
          "Freelance income",
          "Study abroad / higher ed",
          "Financial stability",
        ],
      },
      {
        id: "blocker",
        label: "Sabse bada blocker aaj kya hai?",
        type: "radio",
        required: false,
        options: [
          "Skills ki kami",
          "Time nahi milta",
          "Network / opportunities nahi",
          "Motivation / clarity nahi",
          "Money / resources",
          "Confidence issue",
        ],
      },
      {
        id: "learning_style",
        label: "Best learning style?",
        type: "radio",
        options: [
          "Videos dekh ke",
          "Padh ke (docs / books)",
          "Kar ke (hands-on)",
          "Mentor ke saath",
          "Community / group mein",
        ],
      },
      {
        id: "weekly_time",
        label: "RaahAI ke saath weekly kitna time de sakte ho?",
        type: "dropdown",
        required: false,
        options: ["2-4 hours", "5-8 hours", "9-15 hours", "16-25 hours", "25+ hours"],
      },
      {
        id: "focus_now",
        label: "Ek line mein: abhi ka current focus kya hai?",
        type: "text",
        required: false,
        placeholder: "e.g. React + TypeScript master karna aur first job land karna",
      },
      {
        id: "bio",
        label: "Short bio (optional)",
        type: "text",
        placeholder: "Apne baare mein 1-2 lines",
      },
    ],
  },
];

type Answers = Record<string, string | string[]>;

function scoreAnswers(answers: Answers) {
  const axes: Record<string, number> = {
    technical: 0,
    leadership: 0,
    networking: 0,
    creativity: 0,
    discipline: 0,
  };
  for (const s of SECTIONS) {
    for (const q of s.questions) {
      if (!q.axis || !q.weight) continue;
      const val = answers[q.id];
      if (val == null) continue;
      if (Array.isArray(val)) {
        // checkbox: proportion of selected (excluding "None"/"None yet") vs options
        const good = val.filter((v) => !/^none/i.test(v)).length;
        const total = q.options?.filter((o) => !/^none/i.test(o)).length || 1;
        axes[q.axis] += Math.round((good / total) * q.weight);
      } else if (q.scoreMap) {
        axes[q.axis] += q.scoreMap[val] ?? 0;
      }
    }
  }
  // clamp
  for (const k of Object.keys(axes)) axes[k] = Math.max(0, Math.min(100, axes[k]));
  return axes;
}

function levelFrom(scores: Record<string, number>) {
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
  if (avg < 20) return "Explorer";
  if (avg < 40) return "Builder";
  if (avg < 60) return "Achiever";
  if (avg < 80) return "Strategist";
  return "Luminary";
}

function GrowthDNAPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { scores: Record<string, number>; level: string }>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [retaking, setRetaking] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["assessment_latest"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const q = query(collection(db, "assessments"), where("user_id", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const docs = querySnapshot.docs.map((d) => d.data()).filter((d) => d.completed === true);
      if (docs.length === 0) return null;
      docs.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
      return docs[0];
    },
  });

  // Load existing complete assessment on load so we don't have to fill it again
  useEffect(() => {
    if (existing && !retaking && !done) {
      const scores = scoreAnswers(existing.answers as Answers);
      const level = levelFrom(scores);
      setDone({ scores, level });
    }
  }, [existing, retaking, done]);

  // Load draft answers and step on mount
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      try {
        const localAnswers = localStorage.getItem(`growth-dna-answers-${user.uid}`);
        const localStep = localStorage.getItem(`growth-dna-step-${user.uid}`);
        if (localAnswers) {
          setAnswers(JSON.parse(localAnswers));
        }
        if (localStep) {
          const parsedStep = parseInt(localStep, 10);
          if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep < SECTIONS.length) {
            setStep(parsedStep);
          }
        }
      } catch (e) {
        console.error("Failed to load draft assessment answers", e);
      }
    }
    setIsDraftLoaded(true);
  }, []);

  // Save answers draft to localStorage whenever answers change
  useEffect(() => {
    if (!isDraftLoaded) return;
    const user = auth.currentUser;
    if (!user) return;
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`growth-dna-answers-${user.uid}`, JSON.stringify(answers));
    } else {
      localStorage.removeItem(`growth-dna-answers-${user.uid}`);
    }
  }, [answers, isDraftLoaded]);

  // Save step draft to localStorage whenever step changes
  useEffect(() => {
    if (!isDraftLoaded) return;
    const user = auth.currentUser;
    if (!user) return;
    localStorage.setItem(`growth-dna-step-${user.uid}`, String(step));
  }, [step, isDraftLoaded]);

  const totalSteps = SECTIONS.length;
  const section = SECTIONS[step];
  const progress = Math.round((step / totalSteps) * 100);

  const canNext = useMemo(() => {
    return section.questions.every((q) => {
      if (!q.required) return true;
      const v = answers[q.id];
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return String(v).trim().length > 0;
    });
  }, [answers, section]);

  function setVal(id: string, v: string | string[]) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }

  function toggleCheck(id: string, opt: string, max?: number) {
    const cur = (answers[id] as string[]) || [];
    let next: string[];
    if (cur.includes(opt)) next = cur.filter((x) => x !== opt);
    else {
      if (max && cur.length >= max) {
        toast.error(`Max ${max} select kar sakte ho`);
        return;
      }
      next = [...cur, opt];
    }
    setVal(id, next);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      const scores = scoreAnswers(answers);
      const level = levelFrom(scores);

      // Save assessment
      await addDoc(collection(db, "assessments"), {
        user_id: user.uid,
        answers: answers as never,
        completed: true,
        created_at: new Date().toISOString(),
      });

      // Clear draft on successful completion
      localStorage.removeItem(`growth-dna-answers-${user.uid}`);
      localStorage.removeItem(`growth-dna-step-${user.uid}`);

      // Upsert growth_dna
      await setDoc(
        doc(db, "growth_dna", user.uid),
        {
          user_id: user.uid,
          technical_score: scores.technical,
          leadership_score: scores.leadership,
          networking_score: scores.networking,
          creativity_score: scores.creativity,
          discipline_score: scores.discipline,
          overall_level: level,
          updated_at: new Date().toISOString(),
        },
        { merge: true },
      );

      // Update profile
      await updateDoc(doc(db, "profiles", user.uid), {
        onboarded: true,
        xp: 100, // In a real app this should be an increment, but just setting it for now
        ...(answers.full_name ? { full_name: answers.full_name as string } : {}),
        ...(answers.focus_now ? { current_focus: answers.focus_now as string } : {}),
        ...(answers.bio ? { bio: answers.bio as string } : {}),
        updated_at: new Date().toISOString(),
      });

      // Log activity
      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        type: "assessment",
        title: "Growth DNA assessment complete",
        xp_earned: 100,
        created_at: new Date().toISOString(),
      });

      await qc.invalidateQueries();
      setRetaking(false);
      setDone({ scores, level });
      toast.success("Assessment complete! +100 XP");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kuch galat ho gaya";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          icon={Sparkles}
          accent="Complete"
          title={`You are a ${done.level}`}
          description="Aapki Growth DNA calibrate ho gayi. Ab RaahAI aapko personalized roadmap dega."
        />
        <div className="rounded-2xl border border-primary/30 bg-card/60 p-6 backdrop-blur space-y-4">
          {Object.entries(done.scores).map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-sm capitalize">
                <span>{k}</span>
                <span className="text-muted-foreground">{v}/100</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-aurora to-accent"
                  style={{ width: `${Math.max(4, v)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Dashboard pe jao →
          </button>
          <button
            onClick={() => {
              const user = auth.currentUser;
              if (user) {
                localStorage.removeItem(`growth-dna-answers-${user.uid}`);
                localStorage.removeItem(`growth-dna-step-${user.uid}`);
              }
              setRetaking(true);
              setDone(null);
              setStep(0);
              setAnswers({});
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        icon={Dna}
        accent="Growth DNA Assessment"
        title="Apni asli growth signature discover karo"
        description={
          existing
            ? "Aap pehle bhi de chuke ho — retake karne se scores update ho jayenge."
            : "Detailed assessment. Har jawab AI ko aapko samajhne mein madad karega — baar baar nahi poochna paregi."
        }
      />

      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {totalSteps} · {section.title}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur">
        <h2 className="font-display text-2xl font-bold">{section.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>

        <div className="mt-6 space-y-6">
          {section.questions.map((q) => (
            <QuestionField
              key={q.id}
              q={q}
              value={answers[q.id]}
              onChange={(v) => setVal(q.id, v)}
              onToggle={(opt) => toggleCheck(q.id, opt, q.max)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < totalSteps - 1 ? (
          <button
            onClick={() =>
              canNext ? setStep((s) => s + 1) : toast.error("Required fields fill karo")
            }
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => (canNext ? submit() : toast.error("Required fields fill karo"))}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {submitting ? "Saving..." : "Finish & Calibrate DNA"}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionField({
  q,
  value,
  onChange,
  onToggle,
}: {
  q: Question;
  value: string | string[] | undefined;
  onChange: (v: string) => void;
  onToggle: (opt: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {q.label} {q.required && <span className="text-accent">*</span>}
      </label>
      {q.help && <p className="text-xs text-muted-foreground mb-2">{q.help}</p>}

      {q.type === "text" && (
        <input
          type="text"
          value={(value as string) || ""}
          placeholder={q.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}

      {q.type === "dropdown" && (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Select...</option>
          {q.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {q.type === "radio" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options?.map((o) => {
            const active = value === o;
            return (
              <button
                type="button"
                key={o}
                onClick={() => onChange(o)}
                className={`text-left rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "checkbox" && (
        <div className="flex flex-wrap gap-2">
          {q.options?.map((o) => {
            const arr = (value as string[]) || [];
            const active = arr.includes(o);
            return (
              <button
                type="button"
                key={o}
                onClick={() => onToggle(o)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {active && "✓ "}
                {o}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "scale" && (
        <div className="grid grid-cols-5 gap-2">
          {q.options?.map((o) => {
            const active = value === o;
            return (
              <button
                type="button"
                key={o}
                onClick={() => onChange(o)}
                className={`rounded-lg border px-2 py-3 text-xs transition ${
                  active
                    ? "border-primary bg-primary/15 text-foreground font-medium"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
