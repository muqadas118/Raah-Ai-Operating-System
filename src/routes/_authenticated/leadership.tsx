import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Trophy,
  Users,
  Award,
  Sparkles,
  Send,
  Target,
  Activity,
  Heart,
  HelpCircle,
  TrendingUp,
  Plus,
  Compass,
  ArrowRight,
  Shield,
  Smile,
  BookOpen,
} from "lucide-react";
import {
  evaluateLeadershipStyleAI,
  simulateLeadershipScenarioAI,
  planSocialImpactProjectAI,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/leadership")({
  component: LeadershipPage,
});

// Situational questions for style assessment
const STYLE_QUESTIONS = [
  {
    id: "q1",
    question:
      "Your community team has completely run out of funds to run a local project. What is your first step?",
    options: [
      {
        key: "A",
        text: "I will motivate the team to make small self-contributions and run a simple door-to-door campaign.",
        style: "Servant Leader",
      },
      {
        key: "B",
        text: "I will plan to schedule a high-level pitch meeting with a large corporate sponsor or local philanthropist.",
        style: "Visionary Leader",
      },
      {
        key: "C",
        text: "I will assess each team member's skill inventory to figure out how we can run operations at zero cost through service bartering.",
        style: "Strategic Architect",
      },
      {
        key: "D",
        text: "I will launch a public advocacy campaign and video appeal on social media to secure funding through local awareness.",
        style: "Grassroots Activist",
      },
    ],
  },
  {
    id: "q2",
    question:
      "Two senior team members are constantly arguing, and the team's morale has dropped. How will you handle this situation?",
    options: [
      {
        key: "A",
        text: "I will meet with both individually to listen to their personal issues and offer support to restore peace.",
        style: "Servant Leader",
      },
      {
        key: "B",
        text: "I will remind both of them of the project's high-level social value in front of the entire team to put an end to petty conflicts.",
        style: "Visionary Leader",
      },
      {
        key: "C",
        text: "I will design an objective conflict resolution protocol and separate their tasks and visual roles.",
        style: "Strategic Architect",
      },
      {
        key: "D",
        text: "I will hold an open-circle team meeting where everyone can speak from the heart and resolve the issue through direct feedback.",
        style: "Grassroots Activist",
      },
    ],
  },
  {
    id: "q3",
    question:
      "You are unable to get permission for a local street school. How will you deal with the local authorities?",
    options: [
      {
        key: "A",
        text: "I will show them how we are reducing their burden and maintain a continuous collaborative presence with them.",
        style: "Servant Leader",
      },
      {
        key: "B",
        text: "I will explain to them how this street school can become a hub for future digital leadership and change the fate of the entire area.",
        style: "Visionary Leader",
      },
      {
        key: "C",
        text: "I will compile all rules, standard permissions, and legal documentation into a file folder and present it in a professional format.",
        style: "Strategic Architect",
      },
      {
        key: "D",
        text: "I will team up with the children's parents and local leaders to organize a visual community appeal or peaceful token drive.",
        style: "Grassroots Activist",
      },
    ],
  },
];

// Interactive Scenario templates
const SCENARIOS = [
  {
    id: "sc-1",
    title: "The Relief Camp Burnout Crisis",
    category: "Community Operations",
    difficulty: "Medium",
    description:
      "Your volunteer team has been working continuously for the past 5 days at a relief camp in the flooded areas of Karachi. The teams are exhausted, people are arguing over trivial matters, and the supply of raw materials is delayed. Another relief truck is arriving tomorrow morning and the team is not ready.",
    prompt:
      "As a Lead Volunteer, how will you inspire your team and improve task distribution?",
  },
  {
    id: "sc-2",
    title: "The High School Coding Bootcamp",
    category: "Youth Empowerment",
    difficulty: "Hard",
    description:
      "You have planned to run a freelancing and digital skills bootcamp at a government high school in Quetta. However, the school management is strict and the computer labs are locked. They say 'internet and programming are not part of our syllabus'. The students are highly interested and waiting.",
    prompt:
      "How will you convince the school headmaster and unlock actual access to the labs?",
  },
  {
    id: "sc-3",
    title: "The Neighborhood Waste Management",
    category: "Social Impact & Green Energy",
    difficulty: "Easy",
    description:
      "In a dense local residential block in Lahore, dirt and garbage piles are increasing. Government local authorities are slow. You have decided to launch a 'Trash to Cash' initiative where they can learn waste segregation and sell it. However, residents find it easier to throw garbage in the street.",
    prompt:
      "How will you go door-to-door to change people's coding or behavioral habits and build a community movement?",
  },
];

// Impact Project Templates
const PROJECT_TEMPLATES = [
  {
    title: "Mobile Literacy Van",
    category: "Education",
    idea: "Running a weekly digital literacy van visiting slums and teaching basic computer & smartphone skills to underprivileged children and housewives.",
  },
  {
    title: "Clean Green Neighborhood",
    category: "Environment",
    idea: "A student-led compost and waste recycling system that rewards community households with organic plant fertilizer for correct waste segregation.",
  },
  {
    title: "Girls Who Tech Pakistan",
    category: "Gender Inclusion",
    idea: "An online mentoring and virtual internship-matching circle connecting female IT students in small towns with senior remote developers.",
  },
  {
    title: "Freelance Catalyst",
    category: "Economic Empowerment",
    idea: "Setting up a physical peer-to-peer co-working space in a low-income suburb utilizing spare community halls and crowd-sourced older laptops.",
  },
];

function LeadershipPage() {
  const [activeTab, setActiveTab] = useState("signature");

  // Style Assessment State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStyleResult, setCurrentStyleResult] = useState<any>(null);

  // Scenario Simulator State
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [userResponse, setUserResponse] = useState("");
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Project Planner State
  const [projectIdea, setProjectIdea] = useState("");
  const [projectCategory, setProjectCategory] = useState("Education");
  const [plannedProject, setPlannedProject] = useState<any>(null);

  // Mutations
  const styleMut = useMutation({
    mutationFn: async (args: { answers: Record<string, string> }) => {
      return await evaluateLeadershipStyleAI({ data: args });
    },
    onSuccess: (data) => {
      setCurrentStyleResult(data);
      toast.success("Aapka leadership style discover ho gaya!");
    },
    onError: (e: any) => {
      toast.error(e.message || "Assessment evaluation failed");
    },
  });

  const scenarioMut = useMutation({
    mutationFn: async (args: {
      scenarioId: string;
      scenarioTitle: string;
      scenarioDescription: string;
      userResponse: string;
    }) => {
      return await simulateLeadershipScenarioAI({ data: args });
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      toast.success("AI Mentors have completed reviewing your decision!");
    },
    onError: (e: any) => {
      toast.error(e.message || "Simulation failed");
    },
  });

  const projectMut = useMutation({
    mutationFn: async (args: { idea: string; category: string }) => {
      return await planSocialImpactProjectAI({ data: args });
    },
    onSuccess: (data) => {
      setPlannedProject(data);
      toast.success("Localized action plan generated successfully!");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to generate project plan");
    },
  });

  const handleSelectOption = (qId: string, optionStyle: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionStyle }));
  };

  const handleEvaluateStyle = () => {
    if (Object.keys(answers).length < STYLE_QUESTIONS.length) {
      toast.error("Please answer all questions first!");
      return;
    }
    styleMut.mutate({ answers });
  };

  const handleRunSimulation = () => {
    if (!userResponse.trim()) {
      toast.error("Please type your response to the scenario first.");
      return;
    }
    scenarioMut.mutate({
      scenarioId: selectedScenario.id,
      scenarioTitle: selectedScenario.title,
      scenarioDescription: selectedScenario.description,
      userResponse,
    });
  };

  const handlePlanProject = () => {
    if (!projectIdea.trim()) {
      toast.error("Please enter your project idea or select a template!");
      return;
    }
    projectMut.mutate({
      idea: projectIdea,
      category: projectCategory,
    });
  };

  const applyProjectTemplate = (tpl: (typeof PROJECT_TEMPLATES)[0]) => {
    setProjectIdea(tpl.idea);
    setProjectCategory(tpl.category);
    toast.info(`Applied template: ${tpl.title}`);
  };

  const handleResetStyle = () => {
    setAnswers({});
    setCurrentStyleResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <PageHeader
        icon={Trophy}
        title="AI Leadership & Social Impact Academy"
        description="Assess your superpowers on this multi-agent AI leadership development platform, simulate real-world crisis scenarios, and plan local community impact projects."
        accent="Leadership"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 bg-slate-950 border border-slate-900 p-1 rounded-xl">
          <TabsTrigger value="signature" className="rounded-lg gap-2 text-xs sm:text-sm">
            <Award className="h-4 w-4 text-amber-500" />
            1. Style Assessment
          </TabsTrigger>
          <TabsTrigger value="simulator" className="rounded-lg gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4 text-emerald-500" />
            2. Scenario Simulator
          </TabsTrigger>
          <TabsTrigger value="planner" className="rounded-lg gap-2 text-xs sm:text-sm">
            <Compass className="h-4 w-4 text-sky-500" />
            3. Social Impact Planner
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LEADERSHIP STYLE ASSESSMENT */}
        <TabsContent value="signature" className="space-y-6">
          {!currentStyleResult ? (
            <Card className="border-slate-800 bg-slate-950/40">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-100">
                      Leadership Style Assessment
                    </CardTitle>
                    <CardDescription>
                      This situational assessment will determine your core leadership style and identify your primary strengths.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {STYLE_QUESTIONS.map((q, idx) => (
                  <div
                    key={q.id}
                    className="space-y-3 p-4 rounded-xl border border-slate-900 bg-slate-900/10"
                  >
                    <p className="text-sm font-semibold text-slate-200">
                      Q{idx + 1}: {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt.style;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectOption(q.id, opt.style)}
                            className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm transition-all flex items-start gap-3 ${
                              isSelected
                                ? "bg-amber-500/10 border-amber-500 text-slate-100"
                                : "bg-slate-900/30 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            <span
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                isSelected
                                  ? "border-amber-500 bg-amber-500 text-slate-950"
                                  : "border-slate-800 bg-slate-950"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-slate-900 pt-4">
                <Button
                  onClick={handleEvaluateStyle}
                  disabled={
                    styleMut.isPending || Object.keys(answers).length < STYLE_QUESTIONS.length
                  }
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold gap-2"
                >
                  {styleMut.isPending ? "Analyzing Answers..." : "Evaluate Leadership Signature →"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-amber-500/30 bg-slate-950/60 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />

                <CardHeader className="pb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="border-amber-500/40 text-amber-400 mb-2">
                        My Core Style Assessment
                      </Badge>
                      <CardTitle className="text-3xl font-extrabold text-slate-100 flex items-center gap-2.5">
                        <Award className="h-8 w-8 text-amber-400" />
                        {currentStyleResult.title}
                      </CardTitle>
                      <p className="text-xs text-amber-400 font-mono mt-1">
                        Style Category: {currentStyleResult.style}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetStyle}
                      className="text-slate-400 hover:text-slate-200 border border-slate-800 text-xs self-start"
                    >
                      Retake Quiz
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      "{currentStyleResult.description}"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    {/* Strengths */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Smile className="h-4.5 w-4.5" /> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {currentStyleResult.coreStrengths?.map((str: string, i: number) => (
                          <li
                            key={i}
                            className="flex gap-2 text-xs sm:text-sm text-slate-300 items-start"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Growth Areas */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <TrendingUp className="h-4.5 w-4.5" /> Growth Dimensions
                      </h4>
                      <ul className="space-y-2">
                        {currentStyleResult.growthAreas?.map((g: string, i: number) => (
                          <li
                            key={i}
                            className="flex gap-2 text-xs sm:text-sm text-slate-300 items-start"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Famous Examples */}
                  <div className="pt-6 border-t border-slate-900 space-y-4">
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4.5 w-4.5 text-slate-400" /> Historical & Modern Pakistani
                      Exemplars
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {currentStyleResult.famousPakistaniExamples?.map((ex: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl border border-slate-900 bg-slate-900/20 hover:bg-slate-900/30 transition-colors"
                        >
                          <h5 className="font-bold text-slate-200 text-sm mb-1">{ex.name}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">{ex.legacy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ready to Simulate */}
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-900">
                <p className="text-xs sm:text-sm text-slate-400">
                  Leadership style identified! Now let's test your strategies in interactive simulated scenarios.
                </p>
                <Button
                  onClick={() => setActiveTab("simulator")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm gap-1.5"
                >
                  Go to Scenario Simulator <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* TAB 2: INTERACTIVE SCENARIO SIMULATOR */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Sidebar: Scenario Selector */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Choose Scenario
              </span>
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenario(sc);
                    setSimulationResult(null);
                    setUserResponse("");
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 block ${
                    selectedScenario.id === sc.id
                      ? "border-emerald-500 bg-emerald-500/5 text-slate-100"
                      : "border-slate-900 bg-slate-950 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        sc.difficulty === "Easy"
                          ? "border-emerald-500/30 text-emerald-400"
                          : sc.difficulty === "Medium"
                            ? "border-amber-500/30 text-amber-400"
                            : "border-red-500/30 text-red-400"
                      }`}
                    >
                      {sc.difficulty}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-500">{sc.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{sc.title}</h4>
                </button>
              ))}
            </div>

            {/* Right Main area: Simulated Action */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-800 bg-slate-950/40">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">{selectedScenario.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Category: {selectedScenario.category} | Difficulty:{" "}
                    {selectedScenario.difficulty}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-900/50 border border-slate-900 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      The Situation
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {selectedScenario.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {selectedScenario.prompt}
                    </label>
                    <Textarea
                      placeholder="Type your response here (e.g., specific messages you will send to volunteers, tactics to coordinate logistics, actions to motivate the crowd)..."
                      className="min-h-[120px] bg-slate-900/40 border-slate-800 text-slate-200 placeholder:text-slate-600 text-xs sm:text-sm resize-y"
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-slate-900 pt-4">
                  <Button
                    onClick={handleRunSimulation}
                    disabled={scenarioMut.isPending || !userResponse.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5"
                  >
                    {scenarioMut.isPending ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" /> Gathering Mentors Board...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submit Strategy to AI Mentors Board
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Simulation Result Area */}
              {simulationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-emerald-500/20 bg-slate-950/60 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />

                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
                        Mentors Board Assessment & Feedback
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Mentor Cards */}
                      <div className="grid sm:grid-cols-3 gap-4">
                        {/* Grassroots Mentor */}
                        <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-300">
                              Chaudhary Nabeel
                            </span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-mono text-[10px]">
                              {simulationResult.mentors?.grassroots?.grade || 0}/100
                            </Badge>
                          </div>
                          <span className="text-[9px] text-emerald-500 font-mono block uppercase">
                            Grassroots Mobilizer
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            "{simulationResult.mentors?.grassroots?.feedback}"
                          </p>
                        </div>

                        {/* Strategic Mentor */}
                        <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-300">Dr. Amina</span>
                            <Badge className="bg-sky-500/10 text-sky-400 border-none font-mono text-[10px]">
                              {simulationResult.mentors?.strategic?.grade || 0}/100
                            </Badge>
                          </div>
                          <span className="text-[9px] text-sky-500 font-mono block uppercase">
                            Strategic Planner
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            "{simulationResult.mentors?.strategic?.feedback}"
                          </p>
                        </div>

                        {/* Visionary Mentor */}
                        <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-300">
                              Allama Iqbal Mentor
                            </span>
                            <Badge className="bg-purple-500/10 text-purple-400 border-none font-mono text-[10px]">
                              {simulationResult.mentors?.visionary?.grade || 0}/100
                            </Badge>
                          </div>
                          <span className="text-[9px] text-purple-500 font-mono block uppercase">
                            Visionary Coach
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            "{simulationResult.mentors?.visionary?.feedback}"
                          </p>
                        </div>
                      </div>

                      {/* Synthesis */}
                      <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-1">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Overall AI Panel Analysis
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {simulationResult.overallAnalysis}
                        </p>
                      </div>

                      {/* Recommended Action steps */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Immediate Strategic Actions
                        </h4>
                        <div className="grid gap-2">
                          {simulationResult.recommendedActionPlan?.map(
                            (item: string, i: number) => (
                              <div
                                key={i}
                                className="flex gap-2 text-xs text-slate-300 items-start"
                              >
                                <span className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{item}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Optimized answer */}
                      <div className="pt-6 border-t border-slate-900 space-y-2.5">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-emerald-400" /> Executive Re-write (How
                          an Elite Leader Communicates)
                        </h4>
                        <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl">
                          <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed italic">
                            "{simulationResult.optimizedResponse}"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: SOCIAL IMPACT PROJECT PLANNER */}
        <TabsContent value="planner" className="space-y-6">
          <div className="grid md:grid-cols-[280px_1fr] gap-6">
            {/* Quick Templates sidebar */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Impact Templates
              </span>
              <div className="space-y-2">
                {PROJECT_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyProjectTemplate(tpl)}
                    className="w-full text-left p-3 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/40 transition-colors block text-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-200">{tpl.title}</span>
                      <Badge
                        variant="outline"
                        className="text-[8px] font-mono border-slate-800 px-1 py-0"
                      >
                        {tpl.category}
                      </Badge>
                    </div>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed">{tpl.idea}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form & Planner View */}
            <div className="space-y-6">
              <Card className="border-slate-800 bg-slate-950/40">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                    <Compass className="h-5 w-5 text-sky-400 animate-spin-slow" />
                    New Project Catalyst Planner
                  </CardTitle>
                  <CardDescription>
                    Enter your project idea or choose a template, and the AI will design a step-by-step implementation plan for your local community or neighborhood.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Category</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-sky-500"
                        value={projectCategory}
                        onChange={(e) => setProjectCategory(e.target.value)}
                      >
                        <option value="Education">Education & Skills</option>
                        <option value="Environment">Environment & Clean Energy</option>
                        <option value="Gender Inclusion">Gender Equality / Inclusion</option>
                        <option value="Economic Empowerment">Economic Empowerment & Jobs</option>
                        <option value="Health & Tech">Healthcare & Technology Outreach</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Project Idea & Goal</label>
                    <Textarea
                      placeholder="e.g. Set up a physical computer hub in a low-income suburb of Faisalabad using old crowd-sourced laptops, teaching female college students how to start high-paying freelancing jobs on Upwork..."
                      className="min-h-[90px] bg-slate-900/40 border-slate-800 text-slate-200 placeholder:text-slate-600 text-xs sm:text-sm resize-y"
                      value={projectIdea}
                      onChange={(e) => setProjectIdea(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-slate-900 pt-4">
                  <Button
                    onClick={handlePlanProject}
                    disabled={projectMut.isPending || !projectIdea.trim()}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-semibold gap-1.5"
                  >
                    {projectMut.isPending ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" /> Formulating Implementation
                        Phases...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Assemble Social Project Roadmap
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Planned Project Roadmap View */}
              {plannedProject && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-sky-500/20 bg-slate-950/60 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 to-blue-500" />

                    <CardHeader className="pb-6">
                      <Badge variant="outline" className="border-sky-500/40 text-sky-400 mb-2">
                        Project Blueprint Ready
                      </Badge>
                      <CardTitle className="text-2xl font-bold text-slate-100">
                        {plannedProject.projectTitle}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-sky-300 font-medium italic mt-1">
                        "{plannedProject.tagline}"
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-8">
                      {/* Project Objective */}
                      <div className="p-4 bg-sky-950/10 border border-sky-500/10 rounded-xl space-y-1">
                        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                          Objective
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {plannedProject.objective}
                        </p>
                      </div>

                      {/* Implementation Phases */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="h-4.5 w-4.5 text-sky-400" /> Timeline & Execution
                          Phases
                        </h4>
                        <div className="space-y-4">
                          {plannedProject.phases?.map((p: any, i: number) => (
                            <div
                              key={i}
                              className="p-4 border border-slate-900 bg-slate-900/10 rounded-xl space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-slate-200">
                                  Phase {i + 1}: {p.phaseName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-sky-500/30 text-sky-400"
                                >
                                  {p.duration}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">{p.description}</p>

                              <div className="pt-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  Action Items
                                </span>
                                <div className="grid gap-1 mt-1.5">
                                  {p.actionItems?.map((item: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex gap-2 text-xs text-slate-300 items-start"
                                    >
                                      <span className="text-sky-400 shrink-0 mt-1">•</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Local Tactics & Partners */}
                      <div className="grid md:grid-cols-2 gap-6 pt-2 border-t border-slate-900">
                        {/* Local tactics */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-slate-400" /> Highly Localized Tactics
                            (Pakistan)
                          </h4>
                          <ul className="space-y-2">
                            {plannedProject.localTactics?.map((t: string, i: number) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-300 items-start">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Partners to seek */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" /> Organizations & Partners to
                            Contact
                          </h4>
                          <ul className="space-y-2">
                            {plannedProject.partnersToSeek?.map((part: string, i: number) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-300 items-start">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                                <span>{part}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Sustainability and KPI */}
                      <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-900">
                        {/* Sustainability */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Sustainability & Longevity Plan
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {plannedProject.sustainabilityPlan}
                          </p>
                        </div>

                        {/* KPI */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Impact Metrics & KPIs
                          </h4>
                          <div className="grid gap-1.5">
                            {plannedProject.impactKPIs?.map((kpi: string, i: number) => (
                              <div
                                key={i}
                                className="flex gap-2 text-xs text-slate-300 items-start"
                              >
                                <span className="text-emerald-400 shrink-0 mt-1">✓</span>
                                <span>{kpi}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
