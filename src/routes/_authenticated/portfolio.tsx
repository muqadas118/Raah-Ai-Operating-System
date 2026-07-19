import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  Link as LinkIcon,
  ExternalLink,
  Github,
  Loader2,
  FolderKanban,
  Plus,
  GraduationCap,
  Award,
  Calendar,
  Building,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portfolio")({
  component: PortfolioBuilder,
});

function PortfolioBuilder() {
  const qc = useQueryClient();

  // Modals state
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Form states
  const [expForm, setExpForm] = useState({ title: "", company: "", duration: "", description: "" });
  const [eduForm, setEduForm] = useState({ degree: "", institution: "", year: "", grade: "" });
  const [certForm, setCertForm] = useState({ name: "", issuer: "", year: "", link: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio_full_data"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;

      const profileQ = query(collection(db, "profiles"), where("id", "==", user.uid));
      const profileSnap = await getDocs(profileQ);
      const profile = profileSnap.empty ? null : profileSnap.docs[0].data();

      const projectsQ = query(collection(db, "projects_forge"), where("user_id", "==", user.uid));
      const projectsSnap = await getDocs(projectsQ);
      let projects: any[] = [];
      if (!projectsSnap.empty) {
        const docs = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);
        docs.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        );
        projects = docs[0].projects || [];
      }

      const expQ = query(collection(db, "portfolio_experiences"), where("user_id", "==", user.uid));
      const expSnap = await getDocs(expQ);
      const experiences = expSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

      const eduQ = query(collection(db, "portfolio_educations"), where("user_id", "==", user.uid));
      const eduSnap = await getDocs(eduQ);
      const educations = eduSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

      const certQ = query(
        collection(db, "portfolio_certificates"),
        where("user_id", "==", user.uid),
      );
      const certSnap = await getDocs(certQ);
      const certificates = certSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

      return { profile, projects, experiences, educations, certificates };
    },
  });

  const addExpMut = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      await addDoc(collection(db, "portfolio_experiences"), {
        user_id: user.uid,
        ...expForm,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio_full_data"] });
      setShowExpModal(false);
      setExpForm({ title: "", company: "", duration: "", description: "" });
      toast.success("Experience added successfully");
    },
  });

  const addEduMut = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      await addDoc(collection(db, "portfolio_educations"), {
        user_id: user.uid,
        ...eduForm,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio_full_data"] });
      setShowEduModal(false);
      setEduForm({ degree: "", institution: "", year: "", grade: "" });
      toast.success("Education added successfully");
    },
  });

  const addCertMut = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      await addDoc(collection(db, "portfolio_certificates"), {
        user_id: user.uid,
        ...certForm,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio_full_data"] });
      setShowCertModal(false);
      setCertForm({ name: "", issuer: "", year: "", link: "" });
      toast.success("Certificate added successfully");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async ({ collectionName, id }: { collectionName: string; id: string }) => {
      await deleteDoc(doc(db, collectionName, id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio_full_data"] });
      toast.success("Item deleted");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const { profile, projects, experiences, educations, certificates } = data || {
    profile: null,
    projects: [],
    experiences: [],
    educations: [],
    certificates: [],
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <PageHeader
        icon={Briefcase}
        title="Interactive Portfolio Builder"
        description="Craft a stunning, Google-grade portfolio. Add your experiences, education, and certificates manually, and showcase your AI-forged projects."
      />

      <div className="flex flex-col gap-8">
        {/* Profile Hero section */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950"></div>
          <div className="relative z-10 text-center space-y-6">
            <div className="w-28 h-28 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-sky-500/20">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                {profile?.full_name || "Your Name"}
              </h1>
              <p className="text-lg text-slate-400 mt-3 max-w-2xl mx-auto leading-relaxed">
                {profile?.bio ||
                  "A passionate professional showcasing my journey, technical mastery, and projects."}
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              {profile?.linkedin && (
                <Button
                  variant="outline"
                  className="rounded-full border-slate-700 bg-slate-900 hover:bg-slate-800 hover:text-white"
                  asChild
                >
                  <a href={profile.linkedin} target="_blank" rel="noreferrer">
                    <LinkIcon className="h-4 w-4 mr-2 text-sky-400" /> LinkedIn
                  </a>
                </Button>
              )}
              {profile?.github && (
                <Button
                  variant="outline"
                  className="rounded-full border-slate-700 bg-slate-900 hover:bg-slate-800 hover:text-white"
                  asChild
                >
                  <a href={profile.github} target="_blank" rel="noreferrer">
                    <Github className="h-4 w-4 mr-2 text-slate-300" /> GitHub
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-amber-500" /> Professional Experience
            </h2>
            <Button
              onClick={() => setShowExpModal(true)}
              size="sm"
              className="rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Experience
            </Button>
          </div>

          {experiences.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
              <p>No experiences added yet. Click the + button to add your work history.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {experiences.map((exp: any) => (
                <div
                  key={exp.id}
                  className="group relative bg-slate-950 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition"
                >
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() =>
                        deleteMut.mutate({ collectionName: "portfolio_experiences", id: exp.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-bold text-white">{exp?.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-2 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Building className="h-4 w-4" /> {exp.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {exp.duration}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Education Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-sky-500" /> Education
            </h2>
            <Button
              onClick={() => setShowEduModal(true)}
              size="sm"
              className="rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Education
            </Button>
          </div>

          {educations.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
              <p>No education added yet. Click the + button to add your academic background.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {educations.map((edu: any) => (
                <div
                  key={edu.id}
                  className="group relative bg-slate-950 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() =>
                        deleteMut.mutate({ collectionName: "portfolio_educations", id: edu.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-bold text-white pr-8">{edu.degree}</h3>
                  <p className="text-slate-400 font-medium mt-1">{edu.institution}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/60 text-sm">
                    <span className="text-slate-500">{edu.year}</span>
                    {edu.grade && (
                      <Badge variant="secondary" className="bg-slate-800">
                        {edu.grade}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certificates Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-500" /> Certifications
            </h2>
            <Button
              onClick={() => setShowCertModal(true)}
              size="sm"
              className="rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Certificate
            </Button>
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
              <p>No certificates added yet. Click the + button to add your achievements.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="group relative bg-slate-950 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition flex flex-col h-full"
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() =>
                        deleteMut.mutate({ collectionName: "portfolio_certificates", id: cert.id })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mb-4">
                    <Award className="h-8 w-8 text-purple-400/50 mb-3" />
                    <h3 className="text-base font-bold text-white line-clamp-2 pr-6">
                      {cert.name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{cert.issuer}</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">{cert.year}</span>
                    {cert.link && (
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        Credential <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section className="space-y-6 pt-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-emerald-500" /> Featured Projects
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Projects forged in the Project Forge are automatically displayed here.
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
              <FolderKanban className="h-10 w-10 mx-auto mb-4 opacity-50 text-slate-600" />
              <p>No projects found. Go to Project Forge to create one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((p: any) => (
                <Card key={p.id} className="flex flex-col bg-slate-950 border-slate-800">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-xl text-white">
                        {p.title || "Untitled Project"}
                      </CardTitle>
                      {p.status === "completed" && (
                        <Badge
                          variant="default"
                          className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap"
                        >
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2 text-slate-400 mt-2">
                      {p.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {p.tech_stack && p.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {p.tech_stack.slice(0, 4).map((t: string) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="bg-slate-800 text-slate-300"
                            >
                              {t}
                            </Badge>
                          ))}
                          {p.tech_stack.length > 4 && (
                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                              +{p.tech_stack.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {p.repo_url && (
                      <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-sky-400 hover:text-sky-300 hover:bg-sky-400/10"
                        >
                          <a href={p.repo_url} target="_blank" rel="noreferrer">
                            View Repository <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <Dialog open={showExpModal} onOpenChange={setShowExpModal}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Professional Experience</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a role to your portfolio timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. Frontend Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={expForm.company}
                onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. Google"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={expForm.duration}
                onChange={(e) => setExpForm({ ...expForm, duration: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. Jan 2022 - Present"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                className="bg-slate-900 border-slate-700 min-h-[100px]"
                placeholder="Describe your impact and achievements..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpModal(false)}
              className="bg-transparent border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addExpMut.mutate()}
              disabled={addExpMut.isPending || !expForm.title || !expForm.company}
              className="bg-sky-600 hover:bg-sky-500 text-white"
            >
              {addExpMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEduModal} onOpenChange={setShowEduModal}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="degree">Degree / Course</Label>
              <Input
                id="degree"
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. B.S. Computer Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={eduForm.institution}
                onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. MIT"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Graduation Year</Label>
                <Input
                  id="year"
                  value={eduForm.year}
                  onChange={(e) => setEduForm({ ...eduForm, year: e.target.value })}
                  className="bg-slate-900 border-slate-700"
                  placeholder="e.g. 2024"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grade">Grade / GPA (Optional)</Label>
                <Input
                  id="grade"
                  value={eduForm.grade}
                  onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                  className="bg-slate-900 border-slate-700"
                  placeholder="e.g. 3.8 / 4.0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEduModal(false)}
              className="bg-transparent border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addEduMut.mutate()}
              disabled={addEduMut.isPending || !eduForm.degree || !eduForm.institution}
              className="bg-sky-600 hover:bg-sky-500 text-white"
            >
              {addEduMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              Education
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Certificate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cert_name">Certificate Name</Label>
              <Input
                id="cert_name"
                value={certForm.name}
                onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. AWS Solutions Architect"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issuer">Issuing Organization</Label>
              <Input
                id="issuer"
                value={certForm.issuer}
                onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. Amazon Web Services"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cert_year">Issue Year</Label>
              <Input
                id="cert_year"
                value={certForm.year}
                onChange={(e) => setCertForm({ ...certForm, year: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="e.g. 2023"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Credential URL (Optional)</Label>
              <Input
                id="link"
                value={certForm.link}
                onChange={(e) => setCertForm({ ...certForm, link: e.target.value })}
                className="bg-slate-900 border-slate-700"
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCertModal(false)}
              className="bg-transparent border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addCertMut.mutate()}
              disabled={addCertMut.isPending || !certForm.name || !certForm.issuer}
              className="bg-sky-600 hover:bg-sky-500 text-white"
            >
              {addCertMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ensure FolderKanban is imported if needed, oops I forgot to import it. Let me add it.
// FolderKanban imported at top
