import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Linkedin,
  Twitter,
  Github,
  Calendar,
  BookOpen,
  Copy,
  Check,
  Loader2,
  ChevronRight,
  User,
  Terminal,
  Trophy,
  Briefcase,
  Layers,
  Heart,
  MessageSquare,
  Share2,
  Repeat,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  generateSocialPostsAI,
  generateBioTaglineAI,
  generateReadmeOptimizerAI,
  generateContentCalendarAI,
  generateGrowthStoryAI,
} from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/brand")({
  component: BrandBuilderPage,
});

type ActiveTab = "posts" | "bio" | "readme" | "calendar" | "growth";

function BrandBuilderPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load saved tab on mount/auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const savedTab = localStorage.getItem(`brand-builder-tab-${currentUser.uid}`);
        if (savedTab) {
          setActiveTab(savedTab as ActiveTab);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save active tab when it changes
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      localStorage.setItem(`brand-builder-tab-${currentUser.uid}`, activeTab);
    }
  }, [activeTab]);

  // Server functions
  const runSocialPostsAI = useServerFn(generateSocialPostsAI);
  const runBioTaglineAI = useServerFn(generateBioTaglineAI);
  const runReadmeOptimizerAI = useServerFn(generateReadmeOptimizerAI);
  const runContentCalendarAI = useServerFn(generateContentCalendarAI);
  const runGrowthStoryAI = useServerFn(generateGrowthStoryAI);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        icon={Sparkles}
        accent="AI Brand Builder"
        title="Build Your Personal Brand"
        description="LinkedIn posts, Twitter/X threads, bio, GitHub README — the AI builds a brand around your growth story."
      />

      {/* Primary Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "posts"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Linkedin className="w-4 h-4" />
          <span>Social Posts</span>
        </button>
        <button
          onClick={() => setActiveTab("bio")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "bio"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Bio & Taglines</span>
        </button>
        <button
          onClick={() => setActiveTab("readme")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "readme"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Github className="w-4 h-4" />
          <span>README Gen</span>
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "calendar"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Content Planner</span>
        </button>
        <button
          onClick={() => setActiveTab("growth")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all col-span-2 md:col-span-1 ${
            activeTab === "growth"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Growth Narrative</span>
        </button>
      </div>

      {/* Render the selected brand component */}
      <div className="min-h-[400px]">
        {activeTab === "posts" && (
          <SocialPostsModule
            runSocialPostsAI={runSocialPostsAI}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
          />
        )}
        {activeTab === "bio" && (
          <BioTaglineModule
            runBioTaglineAI={runBioTaglineAI}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
          />
        )}
        {activeTab === "readme" && (
          <ReadmeOptimizerModule
            runReadmeOptimizerAI={runReadmeOptimizerAI}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
          />
        )}
        {activeTab === "calendar" && (
          <ContentCalendarModule
            runContentCalendarAI={runContentCalendarAI}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
          />
        )}
        {activeTab === "growth" && (
          <GrowthStoryModule
            runGrowthStoryAI={runGrowthStoryAI}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   1. SOCIAL POSTS MODULE
   ============================================================================ */
type SocialPostsData = {
  linkedin_post: string;
  x_post: string;
  tip: string;
};

function SocialPostsModule({
  runSocialPostsAI,
  copyToClipboard,
  copiedText,
}: {
  runSocialPostsAI: any;
  copyToClipboard: any;
  copiedText: string | null;
}) {
  const [progress, setProgress] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [tone, setTone] = useState("Professional, tech-savvy, authentic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialPostsData | null>(null);
  const [previewPlatform, setPreviewPlatform] = useState<"linkedin" | "x">("linkedin");

  // Draft Loading & Autosaving
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          const saved = localStorage.getItem(`brand-posts-${currentUser.uid}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.progress !== undefined) setProgress(parsed.progress);
            if (parsed.projectDetails !== undefined) setProjectDetails(parsed.projectDetails);
            if (parsed.tone !== undefined) setTone(parsed.tone);
            if (parsed.result !== undefined) setResult(parsed.result);
          }
        } catch (e) {
          console.error("Error loading brand social posts draft", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && (progress || projectDetails || tone || result)) {
      localStorage.setItem(
        `brand-posts-${currentUser.uid}`,
        JSON.stringify({ progress, projectDetails, tone, result }),
      );
    }
  }, [progress, projectDetails, tone, result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progress.trim()) {
      toast.error("Please enter your progress or achievement!");
      return;
    }
    setLoading(true);
    try {
      const data = await runSocialPostsAI({
        data: { progress, projectDetails, tone },
      });
      setResult(data);
      toast.success("Social media posts generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate social media posts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Form */}
      <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>Progress Update details</span>
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Progress / Achievement Kya Hai? *
            </label>
            <textarea
              required
              rows={3}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="e.g. Today I optimized React routing and improved performance benchmarks by 40%."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Project Details (Optional)
            </label>
            <input
              type="text"
              value={projectDetails}
              onChange={(e) => setProjectDetails(e.target.value)}
              placeholder="e.g. RaahAI - Personalized Developer Roadmap platform"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Post Tone / Style
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="Professional, tech-savvy, authentic">Professional & Technical</option>
              <option value="Hinglish Mix, casual, engaging, relatable">
                Hinglish Creator (Casual & Engaging)
              </option>
              <option value="Humble-brag, storyteller, lessons-learned">
                Storyteller (Humble-brag / Lessons Learned)
              </option>
              <option value="Short, punchy, build in public style">
                Punchy (Build In Public style)
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Writing posts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Social Posts</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Generated Content Preview */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <>
            {/* Visual Previews tabs */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewPlatform("linkedin")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewPlatform === "linkedin"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn Preview</span>
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("x")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewPlatform === "x"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span>Twitter/X Preview</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(
                      previewPlatform === "linkedin" ? result.linkedin_post : result.x_post,
                      previewPlatform === "linkedin" ? "LinkedIn Post" : "X Post",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition-all"
                >
                  {copiedText ===
                  (previewPlatform === "linkedin" ? result.linkedin_post : result.x_post) ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Text</span>
                </button>
              </div>

              {previewPlatform === "linkedin" ? (
                /* LinkedIn Card Preview */
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      ME
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 flex items-center gap-1">
                        <span>Hiring Candidate</span>
                        <span className="text-xs text-slate-500 font-normal">• 1st</span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {projectDetails || "Software Engineer in Training"} • Building in public
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>Just now</span>
                        <span>•</span>
                        <Linkedin className="w-2.5 h-2.5 inline" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-slate-200">
                    {result.linkedin_post}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3">
                    <button className="hover:text-indigo-400 flex items-center gap-1">
                      <Heart className="w-4 h-4" /> <span>Like</span>
                    </button>
                    <button className="hover:text-indigo-400 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> <span>Comment</span>
                    </button>
                    <button className="hover:text-indigo-400 flex items-center gap-1">
                      <Share2 className="w-4 h-4" /> <span>Share</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* X Card Preview */
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/50 border border-slate-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      ME
                    </div>
                    <div className="w-full">
                      <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Developer Builder</span>
                        <span className="text-xs text-slate-500 font-normal">
                          @builder_dev • Just now
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed mt-1 text-slate-100 whitespace-pre-line">
                        {result.x_post}
                      </p>
                      <div className="mt-4 flex justify-between text-xs text-slate-500 max-w-sm border-t border-slate-800 pt-3">
                        <button className="hover:text-sky-400 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> <span>2</span>
                        </button>
                        <button className="hover:text-green-400 flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5" /> <span>5</span>
                        </button>
                        <button className="hover:text-pink-400 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> <span>12</span>
                        </button>
                        <button className="hover:text-sky-400 flex items-center gap-1">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Positioning Tip */}
            {result.tip && (
              <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400">Positioning Pro-Tip:</span>{" "}
                  {result.tip}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full min-h-[300px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
            <Linkedin className="w-12 h-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-medium mb-1">No Social Posts Generated</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              Enter your latest coding progress or project inputs to generate custom-designed professional
              updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   2. BIO & TAGLINE MODULE
   ============================================================================ */
type BioTaglineData = {
  taglines: {
    minimalist: string;
    technical: string;
    action: string;
    creative: string;
  };
  short_bio: string;
  about_section: string;
};

function BioTaglineModule({
  runBioTaglineAI,
  copyToClipboard,
  copiedText,
}: {
  runBioTaglineAI: any;
  copyToClipboard: any;
  copiedText: string | null;
}) {
  const [skills, setSkills] = useState("");
  const [background, setBackground] = useState("");
  const [style, setStyle] = useState("Modern & Scientific");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BioTaglineData | null>(null);

  // Draft Loading & Autosaving
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          const saved = localStorage.getItem(`brand-bio-${currentUser.uid}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.skills !== undefined) setSkills(parsed.skills);
            if (parsed.background !== undefined) setBackground(parsed.background);
            if (parsed.style !== undefined) setStyle(parsed.style);
            if (parsed.result !== undefined) setResult(parsed.result);
          }
        } catch (e) {
          console.error("Error loading brand bio draft", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && (skills || background || style || result)) {
      localStorage.setItem(
        `brand-bio-${currentUser.uid}`,
        JSON.stringify({ skills, background, style, result }),
      );
    }
  }, [skills, background, style, result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skills.trim() || !background.trim()) {
      toast.error("Please enter your skills and background details!");
      return;
    }
    setLoading(true);
    try {
      const data = await runBioTaglineAI({
        data: { skills, background, style },
      });
      setResult(data);
      toast.success("Bios and Taglines generated!");
    } catch (err) {
      console.error(err);
      toast.error("Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Form */}
      <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          <span>Profile Specifications</span>
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Skills & Tech Stack *
            </label>
            <input
              required
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, Python, PostgreSQL, REST APIs"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Background, Goals & Vibe *
            </label>
            <textarea
              required
              rows={4}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="e.g. Self-taught web developer with a background in business. Passionate about building dev-tools and learning in public. Goal is to secure a Full-stack role."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Vibe / Style Direction
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="Modern & Scientific">Modern & Scientific</option>
              <option value="Playful & Creative">Conversational & Creative</option>
              <option value="Hyper-minimalist & Direct">Minimalist & Ultra-clean</option>
              <option value="Aggressive & Outcome-focused">Result & Performance Driven</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting brand profile...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Taglines & Bios</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Output Display */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <div className="space-y-6">
            {/* Taglines block */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-indigo-400" />
                <span>Polished Taglines (LinkedIn Headlines)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.taglines).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-slate-950 border border-slate-850 p-4 rounded-xl relative group hover:border-slate-700 transition-all"
                  >
                    <span className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                      {key}
                    </span>
                    <p className="text-xs text-slate-300 pr-12 font-medium mt-1 leading-relaxed">
                      {value}
                    </p>
                    <button
                      onClick={() => copyToClipboard(value, `${key} Headline`)}
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                      title="Copy Headline"
                    >
                      {copiedText === value ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Short Bio block */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl relative group">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-400" />
                  <span>Twitter / GitHub Micro Bio</span>
                </h4>
                <button
                  onClick={() => copyToClipboard(result.short_bio, "Short Bio")}
                  className="bg-slate-950 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  {copiedText === result.short_bio ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-sm bg-slate-950 border border-slate-850 p-4 rounded-xl leading-relaxed text-slate-200 font-mono">
                {result.short_bio}
              </p>
            </div>

            {/* LinkedIn About block */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl relative group">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-indigo-400" />
                  <span>LinkedIn About Section (Full Bio)</span>
                </h4>
                <button
                  onClick={() => copyToClipboard(result.about_section, "About Bio")}
                  className="bg-slate-950 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  {copiedText === result.about_section ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-sm bg-slate-950 border border-slate-850 p-5 rounded-xl leading-relaxed text-slate-200 whitespace-pre-line">
                {result.about_section}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
            <User className="w-12 h-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-medium mb-1">No Bios Generated Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              Set your skills and background goals to turn your credentials into a highly optimized,
              catchy profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   3. GITHUB README OPTIMIZER MODULE
   ============================================================================ */
type ReadmeOptimizerData = {
  readme_markdown: string;
  optimization_tips: string[];
};

function ReadmeOptimizerModule({
  runReadmeOptimizerAI,
  copyToClipboard,
  copiedText,
}: {
  runReadmeOptimizerAI: any;
  copyToClipboard: any;
  copiedText: string | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [techStack, setTechStack] = useState("");
  const [installation, setInstallation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReadmeOptimizerData | null>(null);
  const [readmeTab, setReadmeTab] = useState<"visual" | "raw">("visual");

  // Draft Loading & Autosaving
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          const saved = localStorage.getItem(`brand-readme-${currentUser.uid}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.title !== undefined) setTitle(parsed.title);
            if (parsed.description !== undefined) setDescription(parsed.description);
            if (parsed.features !== undefined) setFeatures(parsed.features);
            if (parsed.techStack !== undefined) setTechStack(parsed.techStack);
            if (parsed.installation !== undefined) setInstallation(parsed.installation);
            if (parsed.result !== undefined) setResult(parsed.result);
          }
        } catch (e) {
          console.error("Error loading brand readme draft", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && (title || description || features || techStack || installation || result)) {
      localStorage.setItem(
        `brand-readme-${currentUser.uid}`,
        JSON.stringify({ title, description, features, techStack, installation, result }),
      );
    }
  }, [title, description, features, techStack, installation, result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please specify project title and details!");
      return;
    }
    setLoading(true);
    try {
      const data = await runReadmeOptimizerAI({
        data: { title, description, features, techStack, installation },
      });
      setResult(data);
      toast.success("GitHub README optimized and generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to optimize README.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Form */}
      <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Github className="w-5 h-5 text-indigo-400" />
          <span>Project Specifications</span>
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RaahAI Roadmap Builder"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Description / Problem Solved *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. AI-powered roadmap planner that maps careers, creates learning pipelines, and seeds direct portfolio projects."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Key Features (One per line)
            </label>
            <textarea
              rows={3}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="- Dynamic 90-day learning milestone generation
- Core concept check-ins with code/SQL examples
- Professional portfolio project briefs"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tech Stack
            </label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="React, TypeScript, Express, Tailwind CSS, Firestore"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Installation / Setup Script
            </label>
            <input
              type="text"
              value={installation}
              onChange={(e) => setInstallation(e.target.value)}
              placeholder="npm install && npm run dev"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating high-star README...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Optimize & Generate README</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Output Display */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <div className="space-y-6">
            {/* Visual rendering tab vs Raw markdown code */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setReadmeTab("visual")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      readmeTab === "visual"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Rendered README</span>
                  </button>
                  <button
                    onClick={() => setReadmeTab("raw")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      readmeTab === "raw"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Raw Markdown code</span>
                  </button>
                </div>

                <button
                  onClick={() => copyToClipboard(result.readme_markdown, "README Markdown")}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition-all"
                >
                  {copiedText === result.readme_markdown ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Markdown</span>
                </button>
              </div>

              {readmeTab === "visual" ? (
                /* Simulated Rendered Preview */
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 text-slate-300 max-h-[450px] overflow-y-auto font-sans text-sm leading-relaxed space-y-4 prose prose-invert">
                  <div className="border-b border-slate-800 pb-4">
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Github className="w-5 h-5 text-slate-400" />
                      <span>{title || "Project Title"}</span>
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex text-[10px] font-bold bg-indigo-950/50 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded-full">
                        build: passing
                      </span>
                      <span className="inline-flex text-[10px] font-bold bg-emerald-950/50 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full">
                        license: MIT
                      </span>
                      <span className="inline-flex text-[10px] font-bold bg-purple-950/50 border border-purple-900 text-purple-400 px-2 py-0.5 rounded-full">
                        PRs: welcome
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      📖 Project Overview
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
                  </div>

                  {features && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        🚀 Key Features
                      </h3>
                      <ul className="list-none space-y-1 pl-1">
                        {features.split("\n").map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300">
                            <span className="text-indigo-400 shrink-0 mt-1">✔</span>
                            <span>{f.replace(/^[-*•]\s*/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {techStack && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        🛠️ Tech Stack & Architecture
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {techStack.split(",").map((t, i) => (
                          <span
                            key={i}
                            className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-xs text-slate-300 font-mono"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                      {/* Architecture Mock Flow */}
                      <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-400 whitespace-pre overflow-x-auto leading-normal">
                        {`[Client App (SPA)] ---> [API Layer (Express)] ---> [Gemini Engine]
                                      |
                                      +---> [Firebase Auth & Firestore]`}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      ⚙️ Quick Setup Guide
                    </h3>
                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl font-mono text-xs text-slate-300">
                      <div># Clone the repo</div>
                      <div className="text-indigo-400">
                        git clone https://github.com/username/project.git
                      </div>
                      <div className="mt-2"># Install dependencies & run</div>
                      <div className="text-indigo-400">
                        {installation || "npm install && npm run dev"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Raw text view */
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs text-slate-400 overflow-x-auto max-h-[450px] overflow-y-auto leading-relaxed">
                  <pre className="whitespace-pre-wrap">{result.readme_markdown}</pre>
                </div>
              )}
            </div>

            {/* AI Repository Optimization Tips */}
            {result.optimization_tips && result.optimization_tips.length > 0 && (
              <div className="bg-indigo-950/15 border border-indigo-900/40 p-4 rounded-2xl shadow-md">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>GitHub Repository Optimization Action items</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {result.optimization_tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-indigo-400 shrink-0">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[300px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
            <Github className="w-12 h-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-medium mb-1">No README Generated Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              Enter your project specs to auto-generate a comprehensive, high-quality, readable
              repository structure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   4. CONTENT CALENDAR MODULE
   ============================================================================ */
type CalendarPost = {
  day: string;
  platform: string;
  topic: string;
  hook: string;
  body_outline: string[];
  cta: string;
  hashtags: string[];
  difficulty: string;
};

type ContentCalendarData = {
  strategy_overview: string;
  calendar: CalendarPost[];
};

function ContentCalendarModule({
  runContentCalendarAI,
  copyToClipboard,
  copiedText,
}: {
  runContentCalendarAI: any;
  copyToClipboard: any;
  copiedText: string | null;
}) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [frequency, setFrequency] = useState("3 posts per week");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentCalendarData | null>(null);
  const [selectedPostIdx, setSelectedPostIdx] = useState<number>(0);

  // Draft Loading & Autosaving
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          const saved = localStorage.getItem(`brand-calendar-${currentUser.uid}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.topic !== undefined) setTopic(parsed.topic);
            if (parsed.audience !== undefined) setAudience(parsed.audience);
            if (parsed.frequency !== undefined) setFrequency(parsed.frequency);
            if (parsed.result !== undefined) setResult(parsed.result);
          }
        } catch (e) {
          console.error("Error loading brand calendar draft", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && (topic || audience || frequency || result)) {
      localStorage.setItem(
        `brand-calendar-${currentUser.uid}`,
        JSON.stringify({ topic, audience, frequency, result }),
      );
    }
  }, [topic, audience, frequency, result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter your niche or core topic!");
      return;
    }
    setLoading(true);
    try {
      const data = await runContentCalendarAI({
        data: { topic, audience, frequency },
      });
      setResult(data);
      setSelectedPostIdx(0);
      toast.success("7-Day content planner suggestions generated!");
    } catch (err) {
      console.error(err);
      toast.error("Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Form */}
      <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <span>Strategic Constraints</span>
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Niche / Core Topic *
            </label>
            <input
              required
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. TypeScript safety, Backend engineering, Devops basics"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Junior web devs, students, technical hiring managers"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Weekly posting frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="3 posts per week">3 posts per week (Recommended)</option>
              <option value="Daily posts (5 days/week)">Daily posts (5 days/week)</option>
              <option value="Weekend coding specials (2 posts/week)">
                Weekend coding specials (2 posts/week)
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating content strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Content Calendar</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Output Display */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <div className="space-y-6">
            {/* Strategy Overview Banner */}
            {result.strategy_overview && (
              <div className="bg-indigo-950/15 border border-indigo-900/40 p-4 rounded-xl text-xs text-indigo-300 leading-relaxed">
                <span className="font-bold text-indigo-400 uppercase tracking-wide block mb-1">
                  🎯 Campaign Strategy Overview:
                </span>{" "}
                {result.strategy_overview}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Day Selection Sidebar */}
              <div className="md:col-span-5 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">
                  Timeline Posts
                </h4>
                {result.calendar.map((post, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPostIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      selectedPostIdx === idx
                        ? "bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-900/5"
                        : "bg-slate-900/30 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                        {post.day} • {post.platform}
                      </div>
                      <div className="text-xs font-semibold truncate max-w-[150px] text-slate-200">
                        {post.topic}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-55" />
                  </button>
                ))}
              </div>

              {/* Right Active Day Detail Viewer */}
              <div className="md:col-span-7">
                {result.calendar[selectedPostIdx] && (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-2 py-0.5 rounded-full">
                          {result.calendar[selectedPostIdx].day}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-2 leading-relaxed">
                          {result.calendar[selectedPostIdx].topic}
                        </h3>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                          result.calendar[selectedPostIdx].difficulty?.toLowerCase() === "hard"
                            ? "border-red-900 text-red-400 bg-red-950/20"
                            : result.calendar[selectedPostIdx].difficulty?.toLowerCase() ===
                                "medium"
                              ? "border-amber-900 text-amber-400 bg-amber-950/20"
                              : "border-emerald-900 text-emerald-400 bg-emerald-950/20"
                        }`}
                      >
                        {result.calendar[selectedPostIdx].difficulty || "Medium"}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* HOOK Section */}
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Headline Hook</span>
                        </h5>
                        <p className="text-xs font-semibold italic text-indigo-200/90 leading-relaxed pl-2 border-l-2 border-indigo-500">
                          &ldquo;{result.calendar[selectedPostIdx].hook}&rdquo;
                        </p>
                      </div>

                      {/* BODY OUTLINE */}
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Body Bullet Outline
                        </h5>
                        <ul className="space-y-1 pl-1">
                          {result.calendar[selectedPostIdx].body_outline.map((bullet, i) => (
                            <li
                              key={i}
                              className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                            >
                              <span className="text-indigo-400 font-semibold">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CALL TO ACTION */}
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Call-to-Action (CTA)
                        </h5>
                        <p className="text-xs text-slate-300 font-medium">
                          {result.calendar[selectedPostIdx].cta}
                        </p>
                      </div>

                      {/* HASHTAGS */}
                      {result.calendar[selectedPostIdx].hashtags && (
                        <div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {result.calendar[selectedPostIdx].hashtags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850"
                              >
                                #{tag.replace("#", "")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Copy Helper to help write */}
                      <button
                        onClick={() => {
                          const completeOutline = `Topic: ${result.calendar[selectedPostIdx].topic}\nHook: ${result.calendar[selectedPostIdx].hook}\nOutline:\n${result.calendar[selectedPostIdx].body_outline.map((b) => `- ${b}`).join("\n")}\nCTA: ${result.calendar[selectedPostIdx].cta}`;
                          copyToClipboard(completeOutline, "Complete Post Strategy");
                        }}
                        className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 py-2 rounded-xl mt-4 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy strategy blueprint</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
            <Calendar className="w-12 h-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-medium mb-1">No Calendar suggestions Generated</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              Set your coding niche to map out 7 days of precise, engaging content ideas with
              hooks and outlines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   5. GROWTH-STORY NARRATIVE BUILDER MODULE
   ============================================================================ */
type GrowthStoryData = {
  narratives: {
    heroes_journey: string;
    raw_authentic: string;
    key_takeaways: string;
  };
  narrative_advice: string;
};

function GrowthStoryModule({
  runGrowthStoryAI,
  copyToClipboard,
  copiedText,
}: {
  runGrowthStoryAI: any;
  copyToClipboard: any;
  copiedText: string | null;
}) {
  const [background, setBackground] = useState("");
  const [hurdle, setHurdle] = useState("");
  const [turningPoint, setTurningPoint] = useState("");
  const [currentResult, setCurrentResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrowthStoryData | null>(null);
  const [activeStoryStyle, setActiveStoryStyle] = useState<
    "heroes_journey" | "raw_authentic" | "key_takeaways"
  >("heroes_journey");

  // Draft Loading & Autosaving
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          const saved = localStorage.getItem(`brand-growth-story-${currentUser.uid}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.background !== undefined) setBackground(parsed.background);
            if (parsed.hurdle !== undefined) setHurdle(parsed.hurdle);
            if (parsed.turningPoint !== undefined) setTurningPoint(parsed.turningPoint);
            if (parsed.currentResult !== undefined) setCurrentResult(parsed.currentResult);
            if (parsed.result !== undefined) setResult(parsed.result);
          }
        } catch (e) {
          console.error("Error loading brand growth story draft", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && (background || hurdle || turningPoint || currentResult || result)) {
      localStorage.setItem(
        `brand-growth-story-${currentUser.uid}`,
        JSON.stringify({ background, hurdle, turningPoint, currentResult, result }),
      );
    }
  }, [background, hurdle, turningPoint, currentResult, result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!background.trim() || !hurdle.trim() || !turningPoint.trim() || !currentResult.trim()) {
      toast.error("Please fill out all fields so we can build a realistic story!");
      return;
    }
    setLoading(true);
    try {
      const data = await runGrowthStoryAI({
        data: { background, hurdle, turningPoint, currentResult },
      });
      setResult(data);
      toast.success("Growth-story narratives generated!");
    } catch (err) {
      console.error(err);
      toast.error("Story compilation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Form */}
      <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-indigo-400" />
          <span>Timeline Milestones</span>
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              1. Background (Kahan se start kiya?) *
            </label>
            <input
              required
              type="text"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="e.g. Non-CS student, mechanical engineering, first code line in 2024"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              2. Major Hurdle / Challenge (Kya mushkil aayi?) *
            </label>
            <textarea
              required
              rows={2}
              value={hurdle}
              onChange={(e) => setHurdle(e.target.value)}
              placeholder="e.g. Coding logical structure nahi samajh aati thi, infinite loops, and severe imposter syndrome."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              3. Turning Point (When and how did the breakthrough happen?) *
            </label>
            <textarea
              required
              rows={2}
              value={turningPoint}
              onChange={(e) => setTurningPoint(e.target.value)}
              placeholder="e.g. I joined build-in-public and built dynamic projects manually, which helped me solve client-side state hooks."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              4. Current Achievement (What is the succeeding state?) *
            </label>
            <input
              required
              type="text"
              value={currentResult}
              onChange={(e) => setCurrentResult(e.target.value)}
              placeholder="e.g. Made 5 full-scale projects, portfolio is ready, feeling confident."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Weaving your narrative...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Growth Story</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Output Display */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <div className="space-y-6">
            {/* Advice Panel */}
            {result.narrative_advice && (
              <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400">Narrative positioning advice:</span>{" "}
                  {result.narrative_advice}
                </div>
              </div>
            )}

            {/* Narrative Style Selection Tabs */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveStoryStyle("heroes_journey")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeStoryStyle === "heroes_journey"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Hero's Journey (Cinematic)</span>
                  </button>
                  <button
                    onClick={() => setActiveStoryStyle("raw_authentic")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeStoryStyle === "raw_authentic"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Raw & Authentic</span>
                  </button>
                  <button
                    onClick={() => setActiveStoryStyle("key_takeaways")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeStoryStyle === "key_takeaways"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Rapid Key Takeaways</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(
                      result.narratives[activeStoryStyle],
                      `${activeStoryStyle.replace("_", " ")} Narrative`,
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition-all mt-2 sm:mt-0"
                >
                  {copiedText === result.narratives[activeStoryStyle] ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy story</span>
                </button>
              </div>

              {/* Story Display Box */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 leading-relaxed text-slate-200 text-sm max-h-[400px] overflow-y-auto whitespace-pre-line font-serif">
                {result.narratives[activeStoryStyle]}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
            <Trophy className="w-12 h-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-medium mb-1">No Narratives Weaved</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              Provide your background milestone timeline metrics to craft engaging personal growth
              journey copy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
