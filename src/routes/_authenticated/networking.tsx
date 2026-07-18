import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Network,
  Linkedin,
  MessageSquare,
  Compass,
  Calendar,
  Users,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle,
  Copy,
  Clock,
  Sparkles,
  RefreshCw,
  Award,
  AlertCircle,
  Briefcase,
  Check,
  UserCheck,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { generateOutreachAI, optimizeLinkedinAI } from "@/lib/ai.functions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

export const Route = createFileRoute("/_authenticated/networking")({
  component: NetworkingPage,
});

type Contact = {
  id?: string;
  user_id: string;
  name: string;
  role: string;
  company: string;
  platform: "LinkedIn" | "Discord" | "Email" | "Meetup" | "Other";
  contact_url: string;
  last_contact_date: string;
  followup_frequency: "weekly" | "biweekly" | "monthly";
  notes: string;
  created_at: string;
};

type LinkedInAuditResult = {
  headlines: string[];
  about_rewrite: string;
  experience_bullet_points: string;
  seo_keywords: string[];
  strategy: string[];
};

type OutreachResult = {
  subject: string;
  connection_note: string;
  message_body: string;
  follow_up_note: string;
  networking_tip: string;
};

function NetworkingPage() {
  const qc = useQueryClient();
  const generateOutreachFn = useServerFn(generateOutreachAI);
  const optimizeLinkedinFn = useServerFn(optimizeLinkedinAI);
  const [activeTab, setActiveTab] = useState<
    "linkedin" | "outreach" | "communities" | "meetups" | "crm"
  >("linkedin");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
  }, []);

  const user = currentUser || auth.currentUser;

  // ================= 1. LINKEDIN AUDIT STATE & AI MUTATION =================
  const [linkedinInput, setLinkedinInput] = useState({
    headline: "",
    about: "",
    experience: "",
    techStack: "",
  });
  const [auditResult, setAuditResult] = useState<LinkedInAuditResult | null>(null);

  // ================= 2. OUTREACH STATE & AI MUTATION =================
  const [outreachInput, setOutreachInput] = useState({
    targetRole: "Software Engineer",
    platform: "LinkedIn Connection Note (< 300 chars)",
    tone: "Warm Hinglish",
    purpose: "Seeking Mentorship/Advice",
    userBrief: "",
  });
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);

  // ================= 5. CRM RELATIONSHIP TRACKER STATE =================
  const [crmInput, setCrmInput] = useState({
    name: "",
    role: "",
    company: "",
    platform: "LinkedIn" as Contact["platform"],
    contact_url: "",
    followup_frequency: "biweekly" as Contact["followup_frequency"],
    notes: "",
  });

  // Load drafts on auth loaded
  useEffect(() => {
    if (currentUser) {
      try {
        const savedTab = localStorage.getItem(`networking-tab-${currentUser.uid}`);
        if (savedTab) setActiveTab(savedTab as any);

        const savedLinkedin = localStorage.getItem(`networking-linkedin-${currentUser.uid}`);
        if (savedLinkedin) {
          const parsed = JSON.parse(savedLinkedin);
          if (parsed.input) setLinkedinInput(parsed.input);
          if (parsed.result) setAuditResult(parsed.result);
        }

        const savedOutreach = localStorage.getItem(`networking-outreach-${currentUser.uid}`);
        if (savedOutreach) {
          const parsed = JSON.parse(savedOutreach);
          if (parsed.input) setOutreachInput(parsed.input);
          if (parsed.result) setOutreachResult(parsed.result);
        }

        const savedCrm = localStorage.getItem(`networking-crm-${currentUser.uid}`);
        if (savedCrm) {
          setCrmInput(JSON.parse(savedCrm));
        }
      } catch (e) {
        console.error("Error loading networking drafts", e);
      }
    }
  }, [currentUser]);

  // Save activeTab
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`networking-tab-${currentUser.uid}`, activeTab);
    }
  }, [currentUser, activeTab]);

  // Save linkedinInput & auditResult
  useEffect(() => {
    if (
      currentUser &&
      (linkedinInput.headline ||
        linkedinInput.about ||
        linkedinInput.experience ||
        linkedinInput.techStack ||
        auditResult)
    ) {
      localStorage.setItem(
        `networking-linkedin-${currentUser.uid}`,
        JSON.stringify({
          input: linkedinInput,
          result: auditResult,
        }),
      );
    }
  }, [currentUser, linkedinInput, auditResult]);

  // Save outreachInput & outreachResult
  useEffect(() => {
    if (currentUser && (outreachInput.userBrief || outreachResult)) {
      localStorage.setItem(
        `networking-outreach-${currentUser.uid}`,
        JSON.stringify({
          input: outreachInput,
          result: outreachResult,
        }),
      );
    }
  }, [currentUser, outreachInput, outreachResult]);

  // Save crmInput
  useEffect(() => {
    if (
      currentUser &&
      (crmInput.name || crmInput.role || crmInput.company || crmInput.contact_url || crmInput.notes)
    ) {
      localStorage.setItem(`networking-crm-${currentUser.uid}`, JSON.stringify(crmInput));
    }
  }, [currentUser, crmInput]);

  const linkedinMutation = useMutation({
    mutationFn: async () => {
      const res = await optimizeLinkedinFn({
        data: {
          currentHeadline: linkedinInput.headline,
          currentAbout: linkedinInput.about,
          currentExperience: linkedinInput.experience,
          techStack: linkedinInput.techStack,
        },
      });
      return res as LinkedInAuditResult;
    },
    onSuccess: (data) => {
      setAuditResult(data);
      toast.success("LinkedIn profile optimized successfully! 🚀");
    },
    onError: (err) => {
      console.error(err);
      toast.error("LinkedIn optimization me error aayi. Please try again.");
    },
  });

  // ================= 2. OUTREACH AI MUTATION =================
  const outreachMutation = useMutation({
    mutationFn: async () => {
      const res = await generateOutreachFn({
        data: {
          targetRole: outreachInput.targetRole,
          platform: outreachInput.platform,
          tone: outreachInput.tone,
          purpose: outreachInput.purpose,
          userBrief: outreachInput.userBrief,
        },
      });
      return res as OutreachResult;
    },
    onSuccess: (data) => {
      setOutreachResult(data);
      toast.success("Outreach template generated successfully! 📝🔥");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Template generation me error aayi.");
    },
  });

  // ================= 3. DEVELOPER COMMUNITIES DIRECTORY =================
  const [commSearch, setCommSearch] = useState("");
  const [commFilter, setCommFilter] = useState<"all" | "discord" | "slack" | "global" | "local">(
    "all",
  );

  const communities = [
    {
      name: "Reactiflux",
      type: "discord",
      reach: "global",
      members: "210,000+ members",
      focus: "React & Frontend Web Development",
      description:
        "React developers ki sabse badi dynamic hub. Custom #help-react aur jobs channels hain.",
      hack: "Ask unique, genuine questions inside help channels, then DM active mentors who help you.",
      url: "https://www.reactiflux.com",
    },
    {
      name: "WeMakeDevs",
      type: "discord",
      reach: "global",
      members: "60,000+ members",
      focus: "Hackathons, Internships, Open Source",
      description:
        "Kunal Kushwaha dwara banayi gayi, beginner friendly community jo code, open-source aur collaboration promote karti hai.",
      hack: "Active engagement in community projects directly connects you with high-level builders.",
      url: "https://wemakedevs.org",
    },
    {
      name: "Devs Gandhara",
      type: "slack",
      reach: "local",
      members: "12,000+ members",
      focus: "Regional Tech & Mentoring",
      description:
        "Outstanding local/regional developer platform focusing on local references, resume reviews and remote jobs.",
      hack: "Don't miss the #introductions and #referrals channel. Standard resume upload karo yahan.",
      url: "https://github.com", // Fallback URL
    },
    {
      name: "Python Discord",
      type: "discord",
      reach: "global",
      members: "320,000+ members",
      focus: "Backend, AI & Machine Learning",
      description:
        "Python, FastAPI, Django, and Data Science learning community. Offers regular code jams.",
      hack: "Participate in their monthly Code Jams to team up with top developers globally.",
      url: "https://pythondiscord.com",
    },
    {
      name: "Kaggle Community",
      type: "slack",
      reach: "global",
      members: "1.2 Million+ members",
      focus: "Data Science, Python & SQL",
      description:
        "Global community of AI/ML builders, researchers and database analysts sharing datasets.",
      hack: "Comment on popular notebooks or solve playground questions to build high rank and recognition.",
      url: "https://www.kaggle.com",
    },
  ];

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(commSearch.toLowerCase()) ||
      c.focus.toLowerCase().includes(commSearch.toLowerCase());
    if (commFilter === "all") return matchesSearch;
    if (commFilter === "discord") return matchesSearch && c.type === "discord";
    if (commFilter === "slack") return matchesSearch && c.type === "slack";
    if (commFilter === "global") return matchesSearch && c.reach === "global";
    if (commFilter === "local") return matchesSearch && c.reach === "local";
    return matchesSearch;
  });

  // ================= 4. CONFERENCES & MEETUPS GUIDES =================
  const conferenceCheatsheet = [
    {
      title: "Elevator Pitch Taiyar Karein",
      step: "01",
      detail:
        "Apna 30-second summary ready rakhein: 'Aap kaun hain, kis technology pe build karte hain (MERN/Python), aur currently kya exciting project bana rahe hain.'",
    },
    {
      title: "Listen Before You Pitch",
      step: "02",
      detail:
        "Jab kisi active technical circle me join karein, direct interact karne se pehle discuss ho rahi technical topic ko suniye. Frame your entry with value.",
    },
    {
      title: "The Badge / Laptop Sticker Hack",
      step: "03",
      detail:
        "Apne laptop stickers ya lanyard pe niche technology tags lagayein (e.g. 'Ask me about React'). It acts as a perfect conversational ice-breaker.",
    },
    {
      title: "Prompt Follow-up in 24 Hours",
      step: "04",
      detail:
        "Meetup ke baad same day connect on LinkedIn. Add a custom note: 'Great talking to you about XYZ server scalability, let's keep in touch!'",
    },
  ];

  const upcomingMeetups = [
    {
      name: "Google Developer Groups (GDG) DevFests",
      frequency: "Annual / Multi-city",
      strategy:
        "Speakers ki list pehle se dekhein. Unke open-source repositories check karke, presentation ke bad precise technical query pucho.",
    },
    {
      name: "Local Web Dev / Tech Meetups",
      frequency: "Monthly",
      strategy:
        "In meetups me direct jobs mat mango. Target mentors and talk about software design, clean code, and database choices.",
    },
    {
      name: "Tech Conferences (JSConf / PyCon)",
      frequency: "Annual",
      strategy:
        "Volunteer bano! Local tech events me volunteer banne se speakers aur core organisers ke sath close interaction ka golden chance milta hai.",
    },
  ];

  // ================= 5. CRM RELATIONSHIP TRACKER =================

  const {
    data: contacts,
    isLoading: isCrmLoading,
    refetch: refetchCrm,
  } = useQuery({
    queryKey: ["networking_contacts"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "networking_contacts"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Contact[];
      // Sort by creation or next follow-up logic
      return data;
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Auth required");
      const newContact: Contact = {
        user_id: user.uid,
        name: crmInput.name,
        role: crmInput.role,
        company: crmInput.company,
        platform: crmInput.platform,
        contact_url: crmInput.contact_url,
        last_contact_date: new Date().toISOString(),
        followup_frequency: crmInput.followup_frequency,
        notes: crmInput.notes,
        created_at: new Date().toISOString(),
      };
      await addDoc(collection(db, "networking_contacts"), newContact);
    },
    onSuccess: () => {
      toast.success("Contact added to CRM successfully! 👤📋");
      setCrmInput({
        name: "",
        role: "",
        company: "",
        platform: "LinkedIn",
        contact_url: "",
        followup_frequency: "biweekly",
        notes: "",
      });
      refetchCrm();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Contact add karne me issue aaya.");
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "networking_contacts", id));
    },
    onSuccess: () => {
      toast.success("Contact removed from CRM.");
      refetchCrm();
    },
  });

  const markFollowedUpMutation = useMutation({
    mutationFn: async (id: string) => {
      const contactRef = doc(db, "networking_contacts", id);
      await updateDoc(contactRef, {
        last_contact_date: new Date().toISOString(),
      });

      // Award XP
      if (user) {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const prof = profileSnap.data();
          const currentXp = Number(prof?.xp) || 0;
          const newXp = currentXp + 15;
          const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
          await updateDoc(profileRef, { xp: newXp, level: newLevel });

          // Log activity
          await addDoc(collection(db, "activities"), {
            user_id: user.uid,
            type: "crm_contact_followed_up",
            title: `Followed up with contact`,
            description: `Kept connection active for network development.`,
            xp_earned: 15,
            created_at: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Follow-up status updated! +15 XP Earned 📈🎉");
      refetchCrm();
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Calculate if follow-up is due
  const isFollowUpDue = (lastDateStr: string, frequency: Contact["followup_frequency"]) => {
    const lastDate = new Date(lastDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (frequency === "weekly" && diffDays >= 7) return true;
    if (frequency === "biweekly" && diffDays >= 14) return true;
    if (frequency === "monthly" && diffDays >= 30) return true;
    return false;
  };

  const getDaysSinceLastContact = (lastDateStr: string) => {
    const lastDate = new Date(lastDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard! 📋");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <PageHeader
        icon={Network}
        accent="AI Networking Coach"
        title="Build Your Network — Guided"
        description="Offline, online, LinkedIn, Discord, cold outreach — AI aapko sikhata bhi hai aur karwata bhi hai."
      />

      {/* Internal Feature Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border/40 pb-3">
        <button
          onClick={() => setActiveTab("linkedin")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
            activeTab === "linkedin"
              ? "bg-primary text-primary-foreground shadow-lg glow-primary"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn Optimization
        </button>

        <button
          onClick={() => setActiveTab("outreach")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
            activeTab === "outreach"
              ? "bg-primary text-primary-foreground shadow-lg glow-primary"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Outreach Templates
        </button>

        <button
          onClick={() => setActiveTab("communities")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
            activeTab === "communities"
              ? "bg-primary text-primary-foreground shadow-lg glow-primary"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="h-4 w-4" />
          Discord/Community Discovery
        </button>

        <button
          onClick={() => setActiveTab("meetups")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
            activeTab === "meetups"
              ? "bg-primary text-primary-foreground shadow-lg glow-primary"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Meetup & Conferences
        </button>

        <button
          onClick={() => setActiveTab("crm")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
            activeTab === "crm"
              ? "bg-primary text-primary-foreground shadow-lg glow-primary"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Relationship Tracker (CRM)
        </button>
      </div>

      {/* ======================= TAB 1: LINKEDIN OPTIMIZATION ======================= */}
      {activeTab === "linkedin" && (
        <div className="space-y-8 animate-fade-in">
          <div className="rounded-2xl border border-primary/20 bg-card/40 p-6 backdrop-blur">
            <h3 className="font-display text-lg font-bold text-aurora mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recruiter-Magnet Profile Optimizer
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-6">
              Recruiters keyword search ke through profile shortlist karte hain. Apne stack aur
              current profile details enter karein, hamara AI aapke headlines, bios aur search
              factors ko optimize karega.
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Tech Stack / Core Skills
                  </label>
                  <input
                    type="text"
                    value={linkedinInput.techStack}
                    onChange={(e) =>
                      setLinkedinInput((prev) => ({ ...prev, techStack: e.target.value }))
                    }
                    placeholder="e.g., MERN Stack, React, Node.js, Python Developer"
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Current Headline
                  </label>
                  <input
                    type="text"
                    value={linkedinInput.headline}
                    onChange={(e) =>
                      setLinkedinInput((prev) => ({ ...prev, headline: e.target.value }))
                    }
                    placeholder="e.g., Student at Tech University / Open for roles"
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Current "About" (optional)
                </label>
                <textarea
                  value={linkedinInput.about}
                  onChange={(e) => setLinkedinInput((prev) => ({ ...prev, about: e.target.value }))}
                  placeholder="Apna abhi ka brief 'About' detail likhein..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Your Major Projects / Current Experience description
                </label>
                <textarea
                  value={linkedinInput.experience}
                  onChange={(e) =>
                    setLinkedinInput((prev) => ({ ...prev, experience: e.target.value }))
                  }
                  placeholder="Apne projects/experience list karein jisse AI Google Formula ke bullet points likhe..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => linkedinMutation.mutate()}
                  disabled={linkedinMutation.isPending || !linkedinInput.techStack}
                  className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-95 transition flex items-center gap-2 disabled:opacity-40"
                >
                  {linkedinMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Optimize LinkedIn Profile
                </button>
              </div>
            </div>
          </div>

          {/* AUDIT RESULTS PRESENTATION */}
          {auditResult && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur space-y-4">
                <h4 className="font-display font-bold text-lg text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> Optimised Headlines (Recruiter Magnet)
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {auditResult.headlines.map((headline, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl border border-border bg-background p-4 flex flex-col justify-between"
                    >
                      <p className="text-xs md:text-sm text-foreground font-semibold pr-6">
                        {headline}
                      </p>
                      <button
                        onClick={() => copyToClipboard(headline)}
                        className="absolute top-2 right-2 p-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                        title="Headline copy karein"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* About Rewrite */}
                  <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur relative">
                    <h4 className="font-display font-bold text-lg text-primary mb-3">
                      AI Rewrite: 'About' Section
                    </h4>
                    <button
                      onClick={() => copyToClipboard(auditResult.about_rewrite)}
                      className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold text-muted-foreground hover:bg-muted/80"
                    >
                      <Copy className="h-3 w-3" /> Copy About Text
                    </button>
                    <div className="whitespace-pre-wrap text-xs md:text-sm text-muted-foreground leading-relaxed bg-background/50 rounded-xl p-4 border border-border/60">
                      {auditResult.about_rewrite}
                    </div>
                  </div>

                  {/* Experience Bullet Points Formulation */}
                  <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
                    <h4 className="font-display font-bold text-lg text-accent mb-3">
                      Google XYZ Bullet Formula Guidance
                    </h4>
                    <div className="whitespace-pre-wrap text-xs md:text-sm text-muted-foreground leading-relaxed bg-background/50 rounded-xl p-4 border border-border/60 font-mono text-emerald-400">
                      {auditResult.experience_bullet_points}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* SEO Factors */}
                  <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur space-y-3">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                      SEO Discovery Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {auditResult.seo_keywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-semibold border border-primary/20"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Action Connection Strategy */}
                  <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur space-y-3">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                      Connect Strategy Steps
                    </h4>
                    <ul className="space-y-2.5">
                      {auditResult.strategy.map((st, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="font-bold text-primary shrink-0">[{idx + 1}]</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: COLD OUTREACH TEMPLATES ======================= */}
      {activeTab === "outreach" && (
        <div className="space-y-8 animate-fade-in">
          <div className="rounded-2xl border border-primary/20 bg-card/40 p-6 backdrop-blur">
            <h3 className="font-display text-lg font-bold text-aurora mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Outreach Architect
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-6">
              Custom template generate karein targeted roles ke hisab se. Standard professional
              formats aur warm, regional-friendly Hinglish models available hain, jo cold outreach
              messages ko genuine aur high-converting banate hain.
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Recipient Role
                  </label>
                  <select
                    value={outreachInput.targetRole}
                    onChange={(e) =>
                      setOutreachInput((prev) => ({ ...prev, targetRole: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Engineering Manager">Engineering Manager</option>
                    <option value="CTO / Tech Founder">CTO / Tech Founder</option>
                    <option value="Recruiter / HR">Recruiter / HR</option>
                    <option value="Product Manager">Product Manager</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Preferred Platform
                  </label>
                  <select
                    value={outreachInput.platform}
                    onChange={(e) =>
                      setOutreachInput((prev) => ({ ...prev, platform: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="LinkedIn Connection Note (< 300 chars)">
                      LinkedIn Connection Note
                    </option>
                    <option value="LinkedIn Direct Message">LinkedIn Message</option>
                    <option value="Cold Email">Cold Email</option>
                    <option value="Discord/Slack Direct Message">Discord/Slack DM</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Select Tone
                  </label>
                  <select
                    value={outreachInput.tone}
                    onChange={(e) =>
                      setOutreachInput((prev) => ({ ...prev, tone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Warm Hinglish">Warm Hinglish (Friendly Mix)</option>
                    <option value="Professional & Direct">Professional & Direct</option>
                    <option value="Casual & Curious">Casual & Curious</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Outreach Purpose
                  </label>
                  <select
                    value={outreachInput.purpose}
                    onChange={(e) =>
                      setOutreachInput((prev) => ({ ...prev, purpose: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Seeking Mentorship/Advice">Seeking Mentorship/Advice</option>
                    <option value="Requesting Job Referral">Requesting Job Referral</option>
                    <option value="Exploring Collaborative Ideas">Exploring Collaboration</option>
                    <option value="Quick Technical Ask">Quick Technical Query</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Your Brief Profile (What can you say about your stack/projects?)
                </label>
                <textarea
                  value={outreachInput.userBrief}
                  onChange={(e) =>
                    setOutreachInput((prev) => ({ ...prev, userBrief: e.target.value }))
                  }
                  placeholder="e.g. MERN stack developer looking for React mentorship, built 3 fullstack web apps on Github."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => outreachMutation.mutate()}
                  disabled={outreachMutation.isPending}
                  className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-95 transition flex items-center gap-2 disabled:opacity-40"
                >
                  {outreachMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Message Blueprint
                </button>
              </div>
            </div>
          </div>

          {outreachResult && (
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up">
              <div className="md:col-span-2 space-y-6">
                {/* Connection Note if LinkedIn */}
                {outreachResult.connection_note && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 relative">
                    <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded uppercase block w-max mb-2">
                      Personalized Connection Invite Note
                    </span>
                    <h4 className="font-display font-semibold text-sm mb-1.5 text-foreground">
                      LinkedIn Note (Limit: 300 Chars)
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">
                      Note length:{" "}
                      <strong className="text-primary">
                        {outreachResult.connection_note.length} / 300
                      </strong>{" "}
                      characters.
                    </p>
                    <button
                      onClick={() => copyToClipboard(outreachResult.connection_note)}
                      className="absolute top-4 right-4 inline-flex items-center gap-1 bg-muted p-1.5 rounded hover:bg-muted/80 text-xs font-medium text-muted-foreground"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <div className="font-mono text-xs md:text-sm rounded-xl p-3 border border-border/50 bg-background/60 text-emerald-400">
                      {outreachResult.connection_note}
                    </div>
                  </div>
                )}

                {/* Main Message Body */}
                <div className="rounded-2xl border border-border bg-card/40 p-6 relative">
                  <span className="text-[10px] font-bold tracking-widest text-primary bg-primary/15 px-2 py-0.5 rounded uppercase block w-max mb-2">
                    Main Message Template
                  </span>
                  {outreachResult.subject && (
                    <div className="mb-3">
                      <span className="text-xs text-muted-foreground block font-semibold">
                        Subject Line:
                      </span>
                      <strong className="text-sm text-foreground">{outreachResult.subject}</strong>
                    </div>
                  )}
                  <button
                    onClick={() => copyToClipboard(outreachResult.message_body)}
                    className="absolute top-4 right-4 inline-flex items-center gap-1 bg-muted p-1.5 rounded hover:bg-muted/80 text-xs font-medium text-muted-foreground"
                  >
                    <Copy className="h-3 w-3" /> Copy Full Message
                  </button>
                  <div className="whitespace-pre-wrap text-xs md:text-sm text-muted-foreground leading-relaxed bg-background/50 rounded-xl p-4 border border-border/60">
                    {outreachResult.message_body}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Follow-up Note */}
                <div className="rounded-2xl border border-border bg-card/40 p-5 relative">
                  <span className="text-[10px] font-bold tracking-widest text-accent bg-accent/15 px-2 py-0.5 rounded uppercase block w-max mb-2">
                    Follow-Up (Send after 4-5 days)
                  </span>
                  <button
                    onClick={() => copyToClipboard(outreachResult.follow_up_note)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    title="Copy follow up"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <div className="text-xs text-muted-foreground bg-background/40 rounded-xl p-3 border border-border/50 leading-relaxed">
                    {outreachResult.follow_up_note}
                  </div>
                </div>

                {/* Architect tip */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="h-4 w-4 text-primary" />
                    <h5 className="font-display font-semibold text-xs text-foreground uppercase tracking-wider">
                      Coach's Core Insight
                    </h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {outreachResult.networking_tip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: DEVELOPER COMMUNITIES ======================= */}
      {activeTab === "communities" && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls & Categories */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card/25 p-4 rounded-2xl border border-border/60">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={commSearch}
                onChange={(e) => setCommSearch(e.target.value)}
                placeholder="Search community topic or name..."
                className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1 w-full md:w-auto">
              {(["all", "discord", "slack", "global", "local"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCommFilter(filter)}
                  className={`text-[11px] md:text-xs font-semibold px-3 py-1.5 rounded-lg border capitalize transition ${
                    commFilter === filter
                      ? "bg-primary border-primary text-primary-foreground font-bold"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredCommunities.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-border/80 bg-card/30 p-5 hover:border-primary/40 hover:bg-card/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-accent tracking-widest uppercase bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        {c.type} · {c.reach}
                      </span>
                      <h4 className="font-display font-bold text-lg text-foreground mt-1.5">
                        {c.name}
                      </h4>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{c.members}</span>
                  </div>

                  <p className="text-xs font-semibold text-primary/80 mb-2">{c.focus}</p>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4">
                    {c.description}
                  </p>

                  <div className="rounded-xl bg-background/50 border border-border/50 p-3 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                      Networking Hack:
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      "{c.hack}"
                    </p>
                  </div>
                </div>

                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background hover:bg-muted py-2 text-xs font-semibold"
                >
                  Join Community & Connect <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 4: MEETUPS & CONFERENCES ======================= */}
      {activeTab === "meetups" && (
        <div className="space-y-8 animate-fade-in">
          {/* Offline Playbook */}
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 md:p-8 backdrop-blur">
            <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Offline Tech Events Networking Playbook
            </h3>

            <div className="grid md:grid-cols-4 gap-4 mt-6">
              {conferenceCheatsheet.map((cheat) => (
                <div
                  key={cheat.step}
                  className="rounded-2xl border border-border bg-background/40 p-4 relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 text-3xl font-display font-black text-primary/10 select-none">
                    {cheat.step}
                  </div>
                  <h4 className="font-display font-bold text-sm text-foreground pr-8 mb-2">
                    {cheat.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cheat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Targeted Event Types */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold">Upcoming Event Formats & Core Hacks</h3>
            <div className="grid gap-4">
              {upcomingMeetups.map((m) => (
                <div
                  key={m.name}
                  className="rounded-2xl border border-border bg-card/30 p-5 md:p-6 backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {m.frequency}
                    </span>
                    <h4 className="font-display font-bold text-lg text-foreground mt-1">
                      {m.name}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      <strong>Strategical Hack:</strong> {m.strategy}
                    </p>
                  </div>

                  <a
                    href="https://meetup.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Find Local Events
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 5: RELATIONSHIP TRACKER (CRM) ======================= */}
      {activeTab === "crm" && (
        <div className="space-y-8 animate-fade-in">
          {/* CRM Dashboard layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Add New Contact Form */}
            <div className="lg:col-span-1 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur h-max">
              <h3 className="font-display text-md font-bold text-aurora mb-4 flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-primary" /> Add New Contact to Tracker
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={crmInput.name}
                    onChange={(e) => setCrmInput((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Full Name"
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                      Role
                    </label>
                    <input
                      type="text"
                      value={crmInput.role}
                      onChange={(e) => setCrmInput((prev) => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g., Lead Engineer"
                      className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                      Company
                    </label>
                    <input
                      type="text"
                      value={crmInput.company}
                      onChange={(e) =>
                        setCrmInput((prev) => ({ ...prev, company: e.target.value }))
                      }
                      placeholder="e.g., Google"
                      className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                      Platform
                    </label>
                    <select
                      value={crmInput.platform}
                      onChange={(e) =>
                        setCrmInput((prev) => ({
                          ...prev,
                          platform: e.target.value as Contact["platform"],
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Discord">Discord</option>
                      <option value="Email">Email</option>
                      <option value="Meetup">Meetup</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                      Frequency
                    </label>
                    <select
                      value={crmInput.followup_frequency}
                      onChange={(e) =>
                        setCrmInput((prev) => ({
                          ...prev,
                          followup_frequency: e.target.value as Contact["followup_frequency"],
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 Weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                    Contact/Profile URL
                  </label>
                  <input
                    type="url"
                    value={crmInput.contact_url}
                    onChange={(e) =>
                      setCrmInput((prev) => ({ ...prev, contact_url: e.target.value }))
                    }
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                    Interaction Notes
                  </label>
                  <textarea
                    value={crmInput.notes}
                    onChange={(e) => setCrmInput((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Talked about Node.js microservices. Mentorship ask planned."
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={() => addContactMutation.mutate()}
                  disabled={addContactMutation.isPending || !crmInput.name}
                  className="w-full mt-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  {addContactMutation.isPending ? "Saving..." : "Add to CRM"}
                </button>
              </div>
            </div>

            {/* Contacts Lists */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-md font-bold">
                  My Professional Network ({contacts?.length || 0})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Keep interactions active for best reference conversions.
                </span>
              </div>

              {isCrmLoading && (
                <div className="text-center py-12 rounded-2xl border border-border bg-card/25">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading contacts database...</p>
                </div>
              )}

              {contacts && contacts.length === 0 && (
                <div className="text-center py-16 rounded-2xl border border-border/60 bg-card/20 p-6">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <h4 className="font-display font-semibold text-sm">
                    Aapka relationship tracker khali hai
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Apne LinkedIn connections ya online groups ke links ko yahan add karein taake
                    followups miss na hon!
                  </p>
                </div>
              )}

              {contacts && contacts.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {contacts.map((contact) => {
                    const due = isFollowUpDue(
                      contact.last_contact_date,
                      contact.followup_frequency,
                    );
                    const daysAgo = getDaysSinceLastContact(contact.last_contact_date);

                    return (
                      <div
                        key={contact.id}
                        className={`rounded-2xl border p-4 backdrop-blur flex flex-col justify-between transition ${
                          due
                            ? "border-amber-500/30 bg-amber-500/5 glow-amber"
                            : "border-border/80 bg-card/30"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-display font-bold text-sm text-foreground">
                                {contact.name}
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                {contact.role} {contact.company ? `at ${contact.company}` : ""}
                              </p>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                contact.platform === "LinkedIn"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-accent/20 text-accent"
                              }`}
                            >
                              {contact.platform}
                            </span>
                          </div>

                          {contact.notes && (
                            <p className="text-xs text-muted-foreground italic mt-2.5 leading-relaxed bg-background/50 rounded-lg p-2 border border-border/40">
                              "{contact.notes}"
                            </p>
                          )}

                          <div className="mt-3 space-y-1">
                            <div className="text-[10px] text-muted-foreground flex justify-between">
                              <span>Follow-up Frequency:</span>
                              <strong className="text-foreground uppercase tracking-widest text-[9px]">
                                {contact.followup_frequency}
                              </strong>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex justify-between">
                              <span>Last Contacted:</span>
                              <strong className="text-foreground">
                                {daysAgo === 0 ? "Today" : `${daysAgo} days ago`}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                          <button
                            onClick={() => deleteContactMutation.mutate(contact.id!)}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            title="Remove contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            {contact.contact_url && (
                              <a
                                href={contact.contact_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground inline-flex items-center"
                                title="Open profile link"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => markFollowedUpMutation.mutate(contact.id!)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-emerald-500 px-3 py-1.5 text-white hover:opacity-95"
                            >
                              <Check className="h-3 w-3" /> Log Follow-up
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
