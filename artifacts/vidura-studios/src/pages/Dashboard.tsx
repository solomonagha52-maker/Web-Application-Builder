import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { UploadCloud, Loader2, CheckCircle, AlertCircle, FolderOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth, getInitials } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getProjects,
  createProject,
  uploadPdf,
  saveAIResults,
  timeAgo,
  type Project,
} from "@/lib/database";
import { extractPdfText, generateCourseStructure, generateMockCourse } from "@/lib/ai";

type UploadStatus = "idle" | "uploading" | "extracting" | "generating" | "saving" | "done" | "error";

const STATUS_LABELS: Record<UploadStatus, string> = {
  idle: "",
  uploading: "Uploading PDF to cloud storage…",
  extracting: "Extracting text from PDF…",
  generating: "Generating course structure with AI…",
  saving: "Saving course to your workspace…",
  done: "Course ready! Redirecting…",
  error: "Something went wrong. Please try again.",
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "there";

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getProjects(user.id);
      setProjects(data);
    } catch {
      toast({ title: "Could not load projects", variant: "destructive" });
    } finally {
      setLoadingProjects(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a PDF smaller than 50 MB.", variant: "destructive" });
      return;
    }

    try {
      setUploadStatus("uploading");
      const pdfUrl = await uploadPdf(user.id, file);

      const project = await createProject(
        user.id,
        file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
        "",
        pdfUrl
      );

      setUploadStatus("extracting");
      const pdfText = await extractPdfText(file);

      // Cache PDF text for use in per-topic script generation
      try {
        localStorage.setItem(`vidura_pdf_text_${project.id}`, pdfText.substring(0, 12000));
      } catch {
        // Storage quota exceeded — non-fatal
      }

      setUploadStatus("generating");
      let courseData;
      try {
        courseData = await generateCourseStructure(pdfText);
      } catch (aiErr) {
        console.warn("AI unavailable, using template:", aiErr);
        courseData = generateMockCourse(file.name);
        toast({
          title: "AI engine offline",
          description: "A template course structure has been created. You can generate scripts per topic manually.",
        });
      }

      setUploadStatus("saving");
      await saveAIResults(project.id, courseData);
      localStorage.setItem("vidura_active_project_id", project.id);

      setUploadStatus("done");
      await loadProjects();

      setTimeout(() => {
        setLocation("/script-generator");
      }, 1200);
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      toast({
        title: "Upload failed",
        description: String(err),
        variant: "destructive",
      });
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const isProcessing = ["uploading", "extracting", "generating", "saving"].includes(uploadStatus);

  const statusIcon =
    uploadStatus === "done" ? (
      <CheckCircle className="h-8 w-8 text-[#004D40]" />
    ) : uploadStatus === "error" ? (
      <AlertCircle className="h-8 w-8 text-red-500" />
    ) : isProcessing ? (
      <Loader2 className="h-8 w-8 text-[#004D40] animate-spin" />
    ) : (
      <UploadCloud className="h-8 w-8 text-[#004D40]" />
    );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your courses today.
          </p>
        </div>

        {/* PDF Upload Zone */}
        <div
          className={`w-full border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-[#004D40] bg-[#004D40]/5"
              : uploadStatus === "error"
              ? "border-red-300 bg-red-50"
              : uploadStatus === "done"
              ? "border-[#004D40] bg-[#004D40]/5"
              : "border-[#E5E7EB] bg-white hover:border-[#004D40] hover:bg-black/5"
          }`}
          data-testid="pdf-drop-zone"
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            data-testid="input-pdf-upload"
          />
          <div className="h-16 w-16 bg-[#F0F4F4] rounded-full flex items-center justify-center mb-4">
            {statusIcon}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isProcessing || uploadStatus === "done" ? STATUS_LABELS[uploadStatus] : "Upload Curriculum PDF"}
          </h3>
          {uploadStatus === "idle" && (
            <p className="text-muted-foreground text-sm max-w-sm">
              Drag and drop your syllabus, textbook chapters, or lecture notes here. We'll
              automatically structure it into a course with AI-generated scripts per topic.
            </p>
          )}
          {uploadStatus === "error" && (
            <p className="text-red-500 text-sm">{STATUS_LABELS.error}</p>
          )}
          {!isProcessing && uploadStatus === "idle" && (
            <button
              className="mt-4 px-6 py-2.5 rounded-md bg-[#004D40] text-white font-medium text-sm hover:bg-[#003d33] transition-colors"
              data-testid="btn-browse-files"
            >
              Browse Files
            </button>
          )}
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Projects</h2>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#004D40]" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#E5E7EB] rounded-xl bg-white">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Upload your first PDF above to automatically generate a structured course.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-border rounded-xl p-6 flex flex-col hover:shadow-sm transition-shadow"
                  data-testid={`card-project-${project.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      {project.subject && (
                        <span className="inline-block px-3 py-1 rounded-full bg-[#F0F4F4] text-xs font-medium text-foreground mb-3">
                          {project.subject}
                        </span>
                      )}
                      <h3 className="font-bold text-lg leading-tight line-clamp-2">{project.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">
                      {timeAgo(project.updated_at)}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{project.status}</span>
                        <span className="font-semibold">{project.progress}% Complete</span>
                      </div>
                      <div className="h-2 w-full bg-[#F0F4F4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#004D40] rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      className="w-full py-2.5 rounded-md bg-[#004D40] text-white font-medium hover:bg-[#003d33] transition-colors text-sm"
                      data-testid={`btn-continue-project-${project.id}`}
                      onClick={() => {
                        localStorage.setItem("vidura_active_project_id", project.id);
                        setLocation("/script-generator");
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
