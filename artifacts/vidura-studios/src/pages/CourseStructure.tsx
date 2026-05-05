import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronDown, ChevronRight, Video, BookOpen, Clock, FileText, Loader2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  getProjectModules,
  getModuleTopics,
  type Module,
  type Topic,
} from "@/lib/database";
import { supabase } from "@/lib/supabase";

interface ProjectSummary {
  id: string;
  title: string;
  subject: string;
  status: string;
  progress: number;
}

interface ModuleWithTopics extends Module {
  topics: Topic[];
}

export default function CourseStructure() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [modulesWithTopics, setModulesWithTopics] = useState<ModuleWithTopics[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [automating, setAutomating] = useState(false);

  const loadCourseData = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const { data: proj } = await supabase
        .from("projects")
        .select("id, title, subject, status, progress")
        .eq("id", projectId)
        .single();

      if (proj) setProject(proj as ProjectSummary);

      const modules = await getProjectModules(projectId);
      const withTopics: ModuleWithTopics[] = await Promise.all(
        modules.map(async (mod) => {
          const topics = await getModuleTopics(mod.id);
          return { ...mod, topics };
        })
      );
      setModulesWithTopics(withTopics);
      if (withTopics.length > 0) setExpandedModules([withTopics[0].id]);
    } catch {
      toast({ title: "Could not load course data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const pid = localStorage.getItem("vidura_active_project_id");
    if (pid && user) {
      loadCourseData(pid);
    } else if (user) {
      setLoading(false);
    }
  }, [user, loadCourseData]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const totalTopics = modulesWithTopics.reduce((sum, m) => sum + m.topics.length, 0);
  const estimatedHours = Math.round(totalTopics * 12) / 60;

  const handleAutomateProduction = async () => {
    const pid = localStorage.getItem("vidura_active_project_id");
    if (!pid) return;
    setAutomating(true);
    try {
      await supabase
        .from("projects")
        .update({ status: "locked", progress: 100, updated_at: new Date().toISOString() })
        .eq("id", pid);
      toast({ title: "Full course production started!", description: "Scripts are being generated for all topics." });
      setProject((prev) => prev ? { ...prev, status: "locked", progress: 100 } : prev);
      setTimeout(() => setLocation("/script-generator"), 1500);
    } catch {
      toast({ title: "Failed to start production", variant: "destructive" });
    } finally {
      setAutomating(false);
    }
  };

  if (!loading && !project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No course selected</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Upload a PDF on the Dashboard to generate a course structure automatically.
          </p>
          <button
            className="px-6 py-2.5 rounded-md bg-[#004D40] text-white font-medium hover:bg-[#003d33] transition-colors text-sm"
            onClick={() => setLocation("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-[#004D40]" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <h1 className="text-3xl font-extrabold mb-1">{project?.title}</h1>
              {project?.subject && (
                <p className="text-muted-foreground text-base mb-4">{project.subject}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1.5 rounded-full bg-[#F0F4F4] dark:bg-muted text-sm font-semibold border border-border">
                  {modulesWithTopics.length} Modules
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#F0F4F4] dark:bg-muted text-sm font-semibold border border-border">
                  {totalTopics} Topics
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#F0F4F4] dark:bg-muted text-sm font-semibold border border-border flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {estimatedHours > 0 ? `~${estimatedHours.toFixed(1)} hours` : "TBD"}
                </span>
                <span
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold border",
                    project?.status === "locked"
                      ? "bg-[#004D40]/10 text-[#004D40] border-[#004D40]/30"
                      : "bg-[#CCAC00]/10 text-[#CCAC00] border-[#CCAC00]/30"
                  )}
                >
                  {project?.status === "locked" ? "Production Active" : "Draft"}
                </span>
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              {modulesWithTopics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No modules found for this course.
                </div>
              ) : (
                modulesWithTopics.map((module) => {
                  const isExpanded = expandedModules.includes(module.id);
                  return (
                    <div
                      key={module.id}
                      className="border border-border rounded-xl bg-white dark:bg-card overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full px-6 py-5 flex items-center justify-between bg-white dark:bg-card hover:bg-[#F0F4F4]/50 dark:hover:bg-muted/30 transition-colors"
                        data-testid={`btn-toggle-module-${module.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h2 className="text-lg font-bold text-left">{module.title}</h2>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground bg-[#F0F4F4] dark:bg-muted px-3 py-1 rounded-md shrink-0 ml-4">
                          {module.topics.length} Topics
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-[#fafcfc] dark:bg-card/50">
                          {module.topics.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No topics in this module.</p>
                          ) : (
                            module.topics.map((topic, idx) => {
                              const IconComp =
                                topic.content_type === "Video"
                                  ? Video
                                  : topic.content_type === "Reading"
                                  ? BookOpen
                                  : FileText;
                              return (
                                <div
                                  key={topic.id}
                                  className={cn(
                                    "px-8 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                                    idx !== module.topics.length - 1 ? "border-b border-border/50" : ""
                                  )}
                                  data-testid={`topic-row-${topic.id}`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-white dark:bg-muted border border-border flex items-center justify-center shadow-sm shrink-0">
                                      <IconComp className="h-4 w-4 text-[#004D40]" />
                                    </div>
                                    <span className="font-semibold text-foreground">{topic.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0 ml-4">
                                    {topic.duration && (
                                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-muted border border-border text-muted-foreground">
                                        {topic.duration}
                                      </span>
                                    )}
                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#004D40]/10 text-[#004D40]">
                                      {topic.content_type}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Automate button */}
            {project?.status !== "locked" && (
              <div className="mt-12 pt-8 border-t border-border">
                <button
                  className="w-full py-4 rounded-xl bg-[#CCAC00] text-black font-extrabold text-lg hover:bg-[#b39700] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="btn-automate-production"
                  onClick={handleAutomateProduction}
                  disabled={automating || modulesWithTopics.length === 0}
                >
                  {automating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
                  {automating ? "Starting Production…" : "Automate Full Course Production"}
                </button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  This will lock the structure and begin generating scripts for all {totalTopics} topics.
                </p>
              </div>
            )}

            {project?.status === "locked" && (
              <div className="mt-8 pt-6 border-t border-border flex justify-center">
                <button
                  className="px-8 py-3 rounded-xl bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors"
                  onClick={() => setLocation("/script-generator")}
                >
                  Open Script Generator
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
