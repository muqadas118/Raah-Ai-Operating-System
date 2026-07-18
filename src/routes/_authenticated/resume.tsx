import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Wand2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  Upload,
  Download,
  Send,
  FileDown,
  RotateCcw,
  Plus,
  Trash2,
  FileUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { tailorResumeAI } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { jsPDF } from "jspdf";

interface TailoredResume {
  summary: string;
  skills: string[];
  experienceAndProjects: {
    title: string;
    description: string;
  }[];
}

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumeBuilder,
});

function ResumeBuilder() {
  const [opportunity, setOpportunity] = useState("");
  const [resumeData, setResumeData] = useState<TailoredResume | null>(null);

  // File Upload states
  const [uploadedCVText, setUploadedCVText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refinement state
  const [refinementPrompt, setRefinementPrompt] = useState("");

  // Fetch profile and projects
  const { data: baseData } = useQuery({
    queryKey: ["resume_base_data"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return { profile: null, projects: [] };

      const projectsQ = query(collection(db, "projects_forge"), where("user_id", "==", user.uid));
      const projectsSnap = await getDocs(projectsQ);
      const projects = projectsSnap.docs.map((d) => d.data());

      const profileQ = query(collection(db, "profiles"), where("id", "==", user.uid));
      const profileSnap = await getDocs(profileQ);
      const profile = profileSnap.empty ? null : profileSnap.docs[0].data();

      return { profile, projects };
    },
  });

  // Main tailoring mutation
  const { mutate: tailorMut, isPending: isTailoring } = useMutation({
    mutationFn: async () => {
      if (!opportunity.trim()) throw new Error("Please paste a job description or URL first.");
      if (!baseData?.profile)
        throw new Error("Profile not found. Please setup your profile first.");

      return await tailorResumeAI({
        data: {
          profile: baseData.profile,
          projects: baseData.projects,
          opportunity,
          uploadedCVText: uploadedCVText || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setResumeData(data);
      toast.success("Resume tailored successfully!");
    },
    onError: (e: unknown) => {
      const err = e as Error;
      toast.error(err.message || "Failed to generate resume");
    },
  });

  // Interactive AI Refinement mutation
  const { mutate: refineMut, isPending: isRefining } = useMutation({
    mutationFn: async () => {
      if (!refinementPrompt.trim()) throw new Error("Please type refinement instructions first.");
      if (!resumeData) throw new Error("No resume to refine.");

      return await tailorResumeAI({
        data: {
          profile: baseData?.profile || {},
          projects: baseData?.projects || [],
          opportunity,
          uploadedCVText: uploadedCVText || undefined,
          refinementInstruction: refinementPrompt,
          previousResume: resumeData,
        },
      });
    },
    onSuccess: (data) => {
      setResumeData(data);
      setRefinementPrompt("");
      toast.success("Resume refined successfully!");
    },
    onError: (e: unknown) => {
      const err = e as Error;
      toast.error(err.message || "Failed to refine resume");
    },
  });

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadedCVText(text);
      setUploadedFileName(file.name);
      toast.success(`Existing CV (${file.name}) uploaded & text parsed successfully!`);
    };

    // Read TXT, MD, HTML, JSON, etc as text
    if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".csv")
    ) {
      reader.readAsText(file);
    } else {
      // Fallback for PDFs and Word docs: we can parse metadata or simply inform them we registered the file,
      // but recommend copy pasting text from PDF for absolute accuracy.
      setUploadedFileName(file.name);
      // Let's create a placeholder text representing the file name and ask them to refine if they want
      setUploadedCVText(
        `Existing CV File uploaded: ${file.name}. (Please paste the raw text content here if possible to get precise keyword matching).`,
      );
      toast.info(
        `Uploaded ${file.name}. For best results with PDF/DOCX, paste the text directly into the area below!`,
        { duration: 6000 },
      );
    }
  };

  const clearUploadedFile = () => {
    setUploadedFileName("");
    setUploadedCVText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Uploaded CV cleared.");
  };

  // Programmatic PDF Exporter using jsPDF
  const handleExportPDF = () => {
    if (!resumeData) return;
    const name = baseData?.profile?.full_name || "Applicant";

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Page width is 210mm, height is 297mm. Margin is 15mm.
      const margin = 15;
      const pageWidth = 210;
      let y = 20;

      // Title / Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text(name, margin, y);
      y += 8;

      // Subtitle/Tagline
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Tailored ATS-Optimized Resume | Raahbar AI", margin, y);
      y += 8;

      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Professional Summary Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text("PROFESSIONAL SUMMARY", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const summaryLines = doc.splitTextToSize(resumeData.summary || "", pageWidth - 2 * margin);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 8;

      // Divider
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Skills Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text("TECHNICAL & HIGHLIGHTED SKILLS", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const skillsText = (resumeData.skills || []).join(", ");
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
      doc.text(skillsLines, margin, y);
      y += skillsLines.length * 5 + 8;

      // Divider
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Relevant Experience & Projects Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text("RELEVANT EXPERIENCE & PROJECTS", margin, y);
      y += 6;

      (resumeData.experienceAndProjects || []).forEach(
        (item: { title: string; description: string }) => {
          // If y is close to the page end, add a new page
          if (y > 240) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(33, 33, 33);
          doc.text(item.title, margin, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const descLines = doc.splitTextToSize(item.description || "", pageWidth - 2 * margin);
          doc.text(descLines, margin, y);
          y += descLines.length * 5 + 8;
        },
      );

      // Footer on each page if multiple pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 15, 287);
        doc.text("Created with Raahbar AI Resume Optimizer", margin, 287);
      }

      doc.save(`${name.replace(/\s+/g, "_")}_Tailored_Resume.pdf`);
      toast.success("CV exported successfully as a highly formatted PDF!");
    } catch (e) {
      console.error("PDF generation failed:", e);
      toast.error("Failed to generate PDF. Downloading txt file as backup.");

      // Fallback: download as text file
      const textContent = `
${baseData?.profile?.full_name || "Applicant"}
Tailored ATS-Optimized Resume | Raahbar AI

PROFESSIONAL SUMMARY
${resumeData.summary}

TECHNICAL & HIGHLIGHTED SKILLS
${(resumeData.skills || []).join(", ")}

RELEVANT EXPERIENCE & PROJECTS
${(resumeData.experienceAndProjects || []).map((p: { title: string; description: string }) => `${p.title}\n${p.description}`).join("\n\n")}
      `;
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name.replace(/\s+/g, "_")}_Tailored_Resume.txt`;
      link.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        icon={FileText}
        title="ATS-Friendly Resume Builder"
        description="Apna target opportunity, details, ya existing CV upload karein aur hum aapki CV ko perfect ATS guidelines ke mutabiq optimize aur refine karenge."
      />

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* STEP 1: CV Upload (Optional but highly recommended) */}
          <Card className="border-slate-800 bg-slate-950/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileUp className="h-4 w-4 text-sky-400" />
                Step 1: Upload Your Existing CV / Resume (Optional)
              </CardTitle>
              <CardDescription>
                Apni existing CV file upload karein ya text paste karein taake AI aapka baseline
                data le sake.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDragActive
                    ? "border-sky-500 bg-sky-950/10"
                    : "border-slate-800 bg-slate-900/10 hover:border-slate-700"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="cv-upload-input"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt,.md,.json,.pdf,.docx"
                  onChange={handleFileInput}
                />

                {uploadedFileName ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-sky-500/10 text-sky-400">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{uploadedFileName}</p>
                      <p className="text-xs text-slate-400">CV successfully linked as context!</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedFile}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/20 text-xs gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove file
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center gap-2 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-3 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      Drag & drop your CV file here, or{" "}
                      <span className="text-sky-400 hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500">Supports TXT, PDF, DOCX, MD (Max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Text fallback for PDF contents */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Or Paste Raw CV Text (Recommended for PDF / DOCX)
                </label>
                <Textarea
                  placeholder="Paste your existing CV sections (Education, Experience, Projects) directly here to guarantee full word matches..."
                  value={uploadedCVText}
                  onChange={(e) => {
                    setUploadedCVText(e.target.value);
                    if (!uploadedFileName) setUploadedFileName("Pasted Resume Text");
                  }}
                  className="bg-slate-900/40 border-slate-800 text-slate-300 placeholder:text-slate-600 min-h-[90px] text-xs resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP 2: Opportunity Details */}
          <Card className="border-slate-800 bg-slate-950/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-400" />
                Step 2: Paste Target Job / Opportunity Details
              </CardTitle>
              <CardDescription>
                Pehle target description ya role specifications copy-paste karein taake AI uss ke
                mutabiq keywords adjust kare.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. We are looking for a React developer with 2+ years of experience in state management, Tailwind, and REST APIs..."
                className="min-h-[120px] bg-slate-900/40 border-slate-800 text-slate-300 placeholder:text-slate-600 text-sm resize-y"
                value={opportunity}
                onChange={(e) => setOpportunity(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t border-slate-900 pt-4">
              <Button
                onClick={() => tailorMut()}
                disabled={isTailoring || !opportunity.trim()}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white gap-2 font-semibold shadow-lg shadow-sky-950/30"
              >
                {isTailoring ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" /> Tailoring your Resume...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Tailor My Resume
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* TAILORED CV DISPLAY */}
          {resumeData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Output format */}
              <Card className="border-sky-500/30 bg-slate-950/60 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-sky-500 to-indigo-500" />

                <CardHeader className="bg-slate-950 border-b border-slate-900 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-100">
                        {baseData?.profile?.full_name || "Your Name"}
                      </CardTitle>
                      <CardDescription className="text-slate-300 mt-2 text-sm leading-relaxed whitespace-pre-line">
                        {resumeData.summary}
                      </CardDescription>
                    </div>

                    {/* Exporter Actions */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        className="bg-sky-950/40 border-sky-500/40 text-sky-400 hover:bg-sky-900/40 hover:text-sky-300 text-xs font-semibold gap-1.5"
                      >
                        <FileDown className="h-4 w-4" /> Export as PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 pt-6">
                  {/* Skills */}
                  <div>
                    <h3 className="font-semibold text-base text-slate-200 border-b border-slate-900 pb-2 mb-4 flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-sky-400" /> Highlighted & Recommended
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills?.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="border-slate-800 bg-slate-900/50 text-slate-300 px-2.5 py-1 text-xs"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience & Projects */}
                  <div>
                    <h3 className="font-semibold text-base text-slate-200 border-b border-slate-900 pb-2 mb-4 flex items-center gap-2">
                      <Briefcase className="h-4.5 w-4.5 text-sky-400" /> Relevant Projects &
                      Experiences
                    </h3>
                    <div className="space-y-6">
                      {resumeData.experienceAndProjects?.map(
                        (item: { title: string; description: string }, i: number) => (
                          <div
                            key={i}
                            className="group rounded-lg border border-slate-900 bg-slate-900/10 p-4 hover:border-slate-800/80 transition-colors"
                          >
                            <h4 className="font-semibold text-slate-200 text-sm mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* STEP 3: INTERACTIVE AI REVISIONS & CHANGINGS */}
              <Card className="border-sky-500/20 bg-slate-950/80 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-sky-400 animate-spin-slow" />
                    Interactive AI Refinement (Adjustments & Changes)
                  </CardTitle>
                  <CardDescription>
                    Kuch tabdeeli karwani hai? AI ko batayein ke kahan change karna hai (e.g.,
                    "skills mein Docker add kardo", "summary thori professional bano", "project
                    content urdu mein likho").
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="e.g. Please add Docker to my skills, shorten the summary, or add a bullet point about database optimization to my top project..."
                      className="min-h-[80px] bg-slate-900/50 border-slate-800 text-slate-300 placeholder:text-slate-600 text-xs resize-none"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-2 border-t border-slate-900">
                  <Button
                    onClick={() => refineMut()}
                    disabled={isRefining || !refinementPrompt.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-semibold"
                  >
                    {isRefining ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" /> Updating Resume...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" /> Refine with AI
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>

        {/* ATS Score Sidebar */}
        <div>
          {resumeData ? (
            <Card className="sticky top-6 border-slate-800 bg-slate-950/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold">
                  <AlertCircle className="h-4 w-4 text-sky-400" /> ATS Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center bg-sky-950/20 rounded-full border-4 border-sky-500/20 shadow-inner">
                    <span className="text-3xl font-bold text-sky-400">{resumeData.atsScore}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-2">
                    ATS Compatibility Score
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-900">
                  <h4 className="font-semibold text-xs text-slate-300">Feedback & Tips:</h4>
                  <ul className="space-y-2">
                    {resumeData.atsFeedback?.map((feedback: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-400 items-start">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feedback}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-950/30 border-dashed border-slate-800 sticky top-6">
              <CardContent className="p-6 text-center text-slate-400 space-y-4">
                <Wand2 className="h-10 w-10 mx-auto opacity-10" />
                <p className="text-xs">
                  Enter opportunity details or upload a CV to receive an instant ATS score matching
                  check.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
