import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Code,
  Landmark,
  Compass,
  ExternalLink,
  Sparkles,
  Loader2,
  Bookmark,
  MapPin,
  Clock,
  Calendar,
  Search,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Check,
  Copy,
  GraduationCap,
  Briefcase,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { generateOpportunitiesAI, generateApplySummaryAI } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

function isDeadlineValid(deadline: string | null | undefined): boolean {
  if (!deadline) return true;
  const lower = deadline.toLowerCase().trim();

  // Rolling/Open/Ongoing/Active are always valid
  if (
    lower.includes("rolling") ||
    lower.includes("open") ||
    lower.includes("always") ||
    lower.includes("ongoing") ||
    lower.includes("currently running") ||
    lower.includes("active") ||
    lower.includes("no deadline") ||
    lower.includes("self-paced") ||
    lower.includes("flexible") ||
    lower.includes("tbd") ||
    lower.includes("tba") ||
    lower.includes("n/a") ||
    lower.includes("continuous") ||
    lower.includes("anytime") ||
    lower.includes("at any time")
  ) {
    return true;
  }

  // If explicitly expired or closed
  if (lower.includes("expired") || lower.includes("closed") || lower.includes("past")) {
    return false;
  }

  try {
    const today = new Date("2026-07-18");
    const parsedDate = new Date(deadline);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate >= today;
    }

    // Check for years < 2026
    const yearMatch = deadline.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year < 2026) return false;
      if (year > 2026) return true;

      const months = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const monthIdx = months.findIndex((m) => lower.includes(m));
      if (monthIdx !== -1) {
        if (monthIdx < 6) return false; // expired (before July)
        if (monthIdx > 6) return true; // upcoming (after July)

        const dayMatch = deadline.match(/\b([123]?\d)\b/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1], 10);
          return day >= 18;
        }
        return true;
      }
    }
  } catch (e) {
    console.error("Error matching deadline date:", deadline, e);
  }
  return true;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  provider: string;
  deadline: string;
  link: string;
  type: string;
  location?: string;
  eligibility?: string;
  reward?: string;
  isExpired?: boolean;
}

export const Route = createFileRoute("/_authenticated/opportunities")({
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{
    pitch?: string;
    strategy?: string;
    steps?: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch base profile and DNA to feed the AI
  const { data: baseData, isLoading: isBaseLoading } = useQuery({
    queryKey: ["opp_base_data"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const profileSnap = await getDocs(
        query(collection(db, "profiles"), where("id", "==", user.uid)),
      );
      const educationsSnap = await getDocs(
        query(collection(db, "portfolio_educations"), where("user_id", "==", user.uid)),
      );
      const experiencesSnap = await getDocs(
        query(collection(db, "portfolio_experiences"), where("user_id", "==", user.uid)),
      );
      const dnaSnap = await getDocs(
        query(collection(db, "growth_dna"), where("user_id", "==", user.uid)),
      );
      return {
        profile: profileSnap.empty ? null : profileSnap.docs[0].data(),
        dna: dnaSnap.empty ? null : dnaSnap.docs[0].data(),
        educations: educationsSnap.docs.map((d) => d.data()),
        experiences: experiencesSnap.docs.map((d) => d.data()),
      };
    },
  });

  // Query AI for real-time worldwide opportunities
  const {
    data: oppData,
    isLoading: isOppLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["ai_opportunities"],
    enabled: !!baseData,
    queryFn: async () => {
      const res = await generateOpportunitiesAI({
        data: {
          userProfile: baseData?.profile || null,
          dna: baseData?.dna || null,
          educations: baseData?.educations || [],
          experiences: baseData?.experiences || [],
        },
      });
      return res;
    },
    staleTime: 1000 * 60 * 60 * 24, // cache for 24h
  });

  const handleGenerateSummary = async (opp: Opportunity) => {
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      const res = await generateApplySummaryAI({
        data: {
          dnaData: baseData?.dna || {},
          opportunityTitle: opp.title,
          opportunityDesc: opp.description,
          provider: opp.provider,
        },
      });

      setSummaryResult(res);
      toast.success("AI Application Strategy generated!");
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error(err);
      toast.error(err.message || "Failed to generate strategy");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyPitch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isBaseLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const allOppsRaw = [
    ...(oppData?.scholarships || []),
    ...(oppData?.internships || []),
    ...(oppData?.certificates || []),
    ...(oppData?.hackathons || []),
    ...(oppData?.schemes || []),
  ];

  // Exclude expired opportunities, only show active/upcoming ones
  const allOpps = allOppsRaw.filter((opp) => isDeadlineValid(opp.deadline));

  // Count items per category
  const scholarshipsCount = allOpps.filter((o) =>
    o.type.toLowerCase().includes("scholarship"),
  ).length;
  const internshipsCount = allOpps.filter((o) =>
    o.type.toLowerCase().includes("internship"),
  ).length;
  const certificatesCount = allOpps.filter((o) =>
    o.type.toLowerCase().includes("certificate"),
  ).length;
  const hackathonsCount = allOpps.filter((o) => o.type.toLowerCase().includes("hackathon")).length;
  const schemesCount = allOpps.filter(
    (o) =>
      o.type.toLowerCase().includes("scheme") ||
      o.type.toLowerCase().includes("program") ||
      o.type.toLowerCase().includes("fellowship"),
  ).length;

  const filteredOpps =
    activeTab === "all"
      ? allOpps
      : allOpps.filter((o) => {
          const typeLower = o.type.toLowerCase();
          if (activeTab === "scheme") {
            return (
              typeLower.includes("scheme") ||
              typeLower.includes("program") ||
              typeLower.includes("fellowship")
            );
          }
          return typeLower.includes(activeTab);
        });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader
          icon={Compass}
          title="Global Opportunities Scout"
          description="Real-time, AI-curated worldwide scholarships, internships, certificates, hackathons, and schemes matching your exact skill profile."
        />
        <Button
          onClick={() => refetch()}
          disabled={isOppLoading || isRefetching}
          className="bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Refresh Global Matches
        </Button>
      </div>

      {!oppData && isOppLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-950/50 border border-slate-800 rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-sky-500 mb-4" />
          <p className="text-slate-400 font-medium">
            Scanning the globe for perfect opportunities...
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Listings */}
          <div className="lg:col-span-5 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950 border border-slate-800 p-1 w-full flex flex-wrap h-auto gap-1">
                <TabsTrigger
                  value="all"
                  className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  All ({allOpps.length})
                </TabsTrigger>
                <TabsTrigger
                  value="scholarship"
                  className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs px-1"
                >
                  Scholarships ({scholarshipsCount})
                </TabsTrigger>
                <TabsTrigger
                  value="internship"
                  className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs px-1"
                >
                  Internships ({internshipsCount})
                </TabsTrigger>
                <TabsTrigger
                  value="certificate"
                  className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs px-1"
                >
                  Certificates ({certificatesCount})
                </TabsTrigger>
                <TabsTrigger
                  value="hackathon"
                  className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs px-1"
                >
                  Hackathons ({hackathonsCount})
                </TabsTrigger>
                <TabsTrigger
                  value="scheme"
                  className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs px-1"
                >
                  Schemes ({schemesCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredOpps.map((opp: Opportunity) => (
                <div
                  key={opp.id}
                  onClick={() => {
                    setSelectedOpp(opp);
                    setSummaryResult(null);
                  }}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all duration-300 ${
                    selectedOpp?.id === opp.id
                      ? "bg-slate-900 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-[1.02]"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-white leading-tight pr-4">{opp.title}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active & Verified
                      </span>
                    </div>
                    {opp.type === "Scholarship" && (
                      <GraduationCap className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    {opp.type === "Internship" && (
                      <Briefcase className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    {opp.type === "Certificate" && (
                      <Award className="h-5 w-5 text-purple-500 shrink-0" />
                    )}
                    {opp.type === "Hackathon" && (
                      <Code className="h-5 w-5 text-pink-500 shrink-0" />
                    )}
                    {opp.type === "Scheme" && (
                      <Landmark className="h-5 w-5 text-orange-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-medium mb-3">{opp.provider}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none">
                      {opp.location}
                    </Badge>
                    {opp.prizesOrValue && (
                      <Badge variant="outline" className="border-sky-500/30 text-sky-400">
                        {opp.prizesOrValue}
                      </Badge>
                    )}
                    {opp.isPaid !== undefined && (
                      <Badge
                        variant="outline"
                        className={
                          opp.isPaid
                            ? "border-rose-500/30 text-rose-400"
                            : "border-emerald-500/30 text-emerald-400"
                        }
                      >
                        {opp.isPaid ? "Paid" : "Free"}
                      </Badge>
                    )}
                    {opp.deadline && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5 flex items-center gap-1 font-mono text-xs"
                      >
                        <Calendar className="h-3 w-3 shrink-0" />
                        {opp.deadline}
                      </Badge>
                    )}
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3">
                    <p className="text-xs text-sky-300 flex gap-1.5 items-start">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {opp.matchReason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Detailed View */}
          <div className="lg:col-span-7">
            {selectedOpp ? (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 sticky top-6 shadow-2xl flex flex-col h-[700px]">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-slate-800 hover:bg-slate-800 text-white border-none">
                        {selectedOpp.type}
                      </Badge>
                      {selectedOpp.deadline && (
                        <span className="text-xs font-mono text-rose-400 bg-rose-400/10 px-2 py-1 rounded-md">
                          Deadline: {selectedOpp.deadline}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-white leading-tight mb-2">
                      {selectedOpp.title}
                    </h2>
                    <p className="text-lg text-slate-400">{selectedOpp.provider}</p>
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-slate-300 leading-relaxed">{selectedOpp.description}</p>
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4" /> Why this matches you:
                    </h4>
                    <p className="text-sm text-sky-200/80 leading-relaxed">
                      {selectedOpp.matchReason}
                    </p>
                  </div>

                  {selectedOpp.requiredDocs && selectedOpp.requiredDocs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <ListChecks className="h-4 w-4" /> Requirements
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedOpp.requiredDocs.map((doc: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-300">{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Strategy Builder Section */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden mt-8">
                    <div className="bg-gradient-to-r from-sky-900/40 to-indigo-900/40 p-6 border-b border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-sky-400" />
                        <h3 className="text-lg font-bold text-white">RaahAI Strategy Builder</h3>
                      </div>
                      <p className="text-sm text-slate-400">
                        Generate a custom cover pitch, resume tailoring tips, and interview secrets
                        based on your DNA profile.
                      </p>
                    </div>

                    <div className="p-6">
                      {summaryResult ? (
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Custom Pitch
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyPitch(summaryResult.cover_pitch)}
                              >
                                {copied ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-400" />
                                )}
                              </Button>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                {summaryResult.cover_pitch}
                              </p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                                Resume Edits
                              </span>
                              <ul className="space-y-2">
                                {summaryResult.resume_tips.map((tip: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="text-sm text-slate-300 flex items-start gap-2"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                                Secret Weapon
                              </span>
                              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                                <p className="text-sm text-amber-200/80 leading-relaxed">
                                  {summaryResult.interview_secret}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Button
                            onClick={() => handleGenerateSummary(selectedOpp)}
                            disabled={isSummarizing}
                            className="w-full sm:w-auto px-8 py-6 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/25"
                          >
                            {isSummarizing ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                              <Sparkles className="h-5 w-5 mr-2" />
                            )}
                            {isSummarizing ? "Analyzing Profile..." : "Build My Custom Strategy"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 mt-6">
                  <Button
                    asChild
                    className="w-full py-6 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-bold text-base"
                  >
                    <a href={selectedOpp.website} target="_blank" rel="noreferrer">
                      Go to Official Website <ArrowRight className="h-5 w-5 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                  <Compass className="h-10 w-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Select an Opportunity</h3>
                <p className="text-slate-400 max-w-sm">
                  Choose an opportunity from the list to view global details, requirements, and
                  generate your tailored application strategy.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
