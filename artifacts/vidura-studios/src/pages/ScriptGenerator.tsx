import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Download, RefreshCw, Layers, Loader2, Plus, Lock,
  FileText, FileType2, ChevronDown, ChevronRight, Sparkles, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getProjectModules,
  getProjectById,
  getModuleTopics,
  getTopicScenes,
  saveTopicScenes,
  updateScene,
  addSceneToTopic,
  lockTopic,
  type Module,
  type Topic,
  type Scene,
} from "@/lib/database";
import { generateTopicScript } from "@/lib/ai";
import { exportScriptAsPDF, exportScriptAsDocx } from "@/lib/export";

interface ModuleWithTopics extends Module {
  topics: Topic[];
  topicsLoaded: boolean;
}

export default function ScriptGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [modules, setModules] = useState<ModuleWithTopics[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [locking, setLocking] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const loadModules = useCallback(async (pid: string) => {
    setLoadingModules(true);
    try {
      const [mods, project] = await Promise.all([
        getProjectModules(pid),
        getProjectById(pid),
      ]);
      if (project) setProjectTitle(project.title);

      // Load all topics for all modules upfront for instant navigation
      const modsWithTopics: ModuleWithTopics[] = await Promise.all(
        mods.map(async (mod) => {
          const topics = await getModuleTopics(mod.id);
          return { ...mod, topics, topicsLoaded: true };
        })
      );
      setModules(modsWithTopics);

      // Auto-expand first module and select first topic
      if (modsWithTopics.length > 0) {
        const firstMod = modsWithTopics[0];
        setExpandedModules(new Set([firstMod.id]));
        if (firstMod.topics.length > 0) {
          const firstTopic = firstMod.topics[0];
          setActiveTopic(firstTopic);
          setActiveTopicId(firstTopic.id);
          setActiveModule(firstMod);
        }
      }
    } catch {
      toast({ title: "Could not load modules", variant: "destructive" });
    } finally {
      setLoadingModules(false);
    }
  }, [toast]);

  const loadScenes = useCallback(async (topicId: string) => {
    setLoadingScenes(true);
    try {
      const data = await getTopicScenes(topicId);
      setScenes(data);
    } catch {
      toast({ title: "Could not load scenes", variant: "destructive" });
    } finally {
      setLoadingScenes(false);
    }
  }, [toast]);

  useEffect(() => {
    const pid = localStorage.getItem("vidura_active_project_id");
    if (pid) {
      setProjectId(pid);
      loadModules(pid);
    } else {
      setLoadingModules(false);
    }
  }, [user, loadModules]);

  useEffect(() => {
    if (activeTopicId) loadScenes(activeTopicId);
  }, [activeTopicId, loadScenes]);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectTopic = (topic: Topic, mod: ModuleWithTopics) => {
    setActiveTopic(topic);
    setActiveTopicId(topic.id);
    setActiveModule(mod);
    setScenes([]);
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  };

  const handleGenerateScript = async () => {
    if (!activeTopic || !activeModule || !projectId) return;
    setGenerating(true);
    try {
      const pdfContext = localStorage.getItem(`vidura_pdf_text_${projectId}`) || "";
      const generatedScenes = await generateTopicScript(
        projectTitle,
        activeModule.title,
        activeTopic.title,
        activeTopic.order_index,
        pdfContext
      );
      const saved = await saveTopicScenes(
        activeTopic.id,
        activeModule.id,
        projectId,
        generatedScenes
      );
      setScenes(saved);
      toast({ title: "Script generated", description: `${generatedScenes.length} scenes created for "${activeTopic.title}".` });
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateScript = async () => {
    if (!activeTopic || !activeModule || !projectId) return;
    setGenerating(true);
    try {
      const pdfContext = localStorage.getItem(`vidura_pdf_text_${projectId}`) || "";
      const generatedScenes = await generateTopicScript(
        projectTitle,
        activeModule.title,
        activeTopic.title,
        activeTopic.order_index,
        pdfContext
      );
      const saved = await saveTopicScenes(
        activeTopic.id,
        activeModule.id,
        projectId,
        generatedScenes
      );
      setScenes(saved);
      toast({ title: "Script regenerated", description: `${generatedScenes.length} scenes updated.` });
    } catch (err) {
      toast({ title: "Regeneration failed", description: String(err), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleScriptChange = async (sceneId: string, newText: string) => {
    setSaving((prev) => ({ ...prev, [sceneId]: true }));
    try {
      await updateScene(sceneId, { script_text: newText });
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, script_text: newText } : s))
      );
    } catch {
      toast({ title: "Failed to save scene", variant: "destructive" });
    } finally {
      setSaving((prev) => ({ ...prev, [sceneId]: false }));
    }
  };

  const handleVisualCueChange = async (sceneId: string, newCue: string) => {
    try {
      await updateScene(sceneId, { visual_cue: newCue });
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, visual_cue: newCue } : s))
      );
    } catch {
      toast({ title: "Failed to save visual cue", variant: "destructive" });
    }
  };

  const handleAddScene = async () => {
    if (!activeTopicId || !activeModule || !projectId) return;
    const nextNum = scenes.length > 0 ? Math.max(...scenes.map((s) => s.scene_number)) + 1 : 1;
    try {
      const newScene = await addSceneToTopic(activeTopicId, activeModule.id, projectId, nextNum);
      setScenes((prev) => [...prev, newScene]);
    } catch {
      toast({ title: "Failed to add scene", variant: "destructive" });
    }
  };

  const handleFinalizeTopic = async () => {
    if (!activeTopicId) return;
    setLocking(true);
    try {
      await lockTopic(activeTopicId);
      setScenes((prev) => prev.map((s) => ({ ...s, is_locked: true })));
      toast({ title: "Topic finalized and locked" });
    } catch {
      toast({ title: "Failed to lock topic", variant: "destructive" });
    } finally {
      setLocking(false);
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    setExportMenuOpen(false);
    if (!activeTopic || scenes.length === 0) {
      toast({ title: "Nothing to export", description: "Select a topic with scenes first.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const payload = {
        courseName: projectTitle || "Untitled Course",
        moduleName: activeTopic.title,
        scenes,
      };
      if (format === "pdf") {
        await exportScriptAsPDF(payload);
        toast({ title: "PDF downloaded", description: `${activeTopic.title} exported as PDF.` });
      } else {
        await exportScriptAsDocx(payload);
        toast({ title: "Word document downloaded", description: `${activeTopic.title} exported as .docx.` });
      }
    } catch {
      toast({ title: "Export failed", description: "Could not generate the file. Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const isTopicLocked = scenes.length > 0 && scenes.every((s) => s.is_locked);

  // Word count for current scenes
  const wordCount = scenes.reduce((acc, s) => {
    return acc + (s.script_text || "").split(/\s+/).filter(Boolean).length;
  }, 0);

  if (!loadingModules && !projectId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No project selected</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Upload a PDF on the Dashboard to generate course structure automatically.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-2.5 rounded-md bg-[#004D40] text-white font-medium hover:bg-[#003d33] transition-colors text-sm"
          >
            Go to Dashboard
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-8 -my-4 md:-my-8 overflow-hidden border-t border-border">

        {/* ── Left Panel: Module → Topic tree ───────────────────────── */}
        <div className="w-72 bg-[#F0F4F4] dark:bg-sidebar border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border bg-[#F0F4F4] dark:bg-sidebar">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#004D40]" />
              Course Structure
            </h2>
            {projectTitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{projectTitle}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {loadingModules ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#004D40]" />
              </div>
            ) : modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                No modules found. Upload a PDF first.
              </p>
            ) : (
              modules.map((mod, mi) => (
                <div key={mod.id} className="mb-0.5">
                  {/* Module header */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors",
                      expandedModules.has(mod.id)
                        ? "bg-white/60 dark:bg-white/10 text-[#004D40] dark:text-[#00BFA5]"
                        : "hover:bg-black/5 dark:hover:bg-white/10 text-foreground"
                    )}
                  >
                    {expandedModules.has(mod.id)
                      ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    }
                    <span className="text-xs font-bold uppercase tracking-wider truncate">
                      M{mi + 1}. {mod.title.replace(/^Module \d+:\s*/i, "")}
                    </span>
                  </button>

                  {/* Topics list */}
                  {expandedModules.has(mod.id) && (
                    <div className="bg-white/40 dark:bg-white/5">
                      {mod.topics.map((topic, ti) => (
                        <button
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic, mod)}
                          className={cn(
                            "w-full text-left pl-8 pr-3 py-2.5 text-sm transition-colors flex items-start gap-2",
                            activeTopicId === topic.id
                              ? "bg-white dark:bg-card border-l-4 border-[#004D40] dark:border-[#00BFA5] shadow-sm text-[#004D40] dark:text-[#00BFA5] font-medium"
                              : "hover:bg-white/60 dark:hover:bg-white/10 text-foreground border-l-4 border-transparent"
                          )}
                          data-testid={`btn-select-topic-${topic.id}`}
                        >
                          <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60" />
                          <span className="line-clamp-2 leading-snug text-xs">
                            {ti + 1}. {topic.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Center Panel: Script editor ────────────────────────────── */}
        <div className="flex-1 bg-white dark:bg-background flex flex-col overflow-hidden">

          {/* Topic header bar */}
          {activeTopic && (
            <div className="px-8 py-4 border-b border-border bg-[#FAFAFA] dark:bg-card flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{activeModule?.title}</p>
                <h2 className="font-bold text-base truncate">{activeTopic.title}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {wordCount > 0 && (
                  <span className="text-xs text-muted-foreground bg-[#F0F4F4] dark:bg-muted px-3 py-1 rounded-full">
                    {wordCount.toLocaleString()} words
                  </span>
                )}
                {scenes.length > 0 && !isTopicLocked && (
                  <button
                    onClick={handleRegenerateScript}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#004D40] text-[#004D40] hover:bg-[#004D40]/5 transition-colors disabled:opacity-50"
                    data-testid="btn-regenerate"
                  >
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-3xl mx-auto w-full space-y-6 pb-8">

              {isTopicLocked && (
                <div className="flex items-center gap-2 p-4 bg-[#004D40]/5 border border-[#004D40]/20 rounded-lg text-[#004D40] text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  This topic has been finalized and locked.
                </div>
              )}

              {/* No topic selected */}
              {!activeTopic && !loadingModules && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a topic to begin</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Choose a topic from the course structure on the left. Each topic generates
                    6 detailed scenes of 1,000–1,500 words.
                  </p>
                </div>
              )}

              {/* Loading scenes */}
              {loadingScenes && (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#004D40]" />
                </div>
              )}

              {/* No scenes yet — offer to generate */}
              {!loadingScenes && activeTopic && scenes.length === 0 && !generating && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-16 w-16 bg-[#004D40]/5 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="h-8 w-8 text-[#004D40]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">No script yet for this topic</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
                    Generate a detailed script with exactly 6 scenes and 1,000–1,500 words of
                    professional voiceover narration for:
                  </p>
                  <div className="bg-[#F0F4F4] dark:bg-muted rounded-xl p-4 mb-8 max-w-sm w-full text-left">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{activeModule?.title}</p>
                    <p className="font-semibold text-sm">{activeTopic.title}</p>
                  </div>
                  <button
                    onClick={handleGenerateScript}
                    className="px-8 py-3.5 rounded-md bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors flex items-center gap-2 shadow-sm"
                    data-testid="btn-generate-script"
                  >
                    <Sparkles className="h-5 w-5" />
                    Generate Script for this Topic
                  </button>
                </div>
              )}

              {/* Generating in progress */}
              {generating && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-[#004D40] mb-6" />
                  <h3 className="text-lg font-bold mb-2">Writing script…</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Generating 6 scenes with 1,000–1,500 words of detailed narration. This takes
                    15–30 seconds.
                  </p>
                </div>
              )}

              {/* Scene cards */}
              {!loadingScenes && !generating && scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={cn(
                    "bg-white dark:bg-card border rounded-xl p-6 shadow-sm transition-colors",
                    scene.is_locked
                      ? "border-[#004D40]/30 opacity-80"
                      : "border-[#E5E7EB] dark:border-border hover:border-[#004D40]/30"
                  )}
                  data-testid={`scene-card-${scene.id}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base">{scene.title}</h3>
                    <div className="flex items-center gap-2">
                      {saving[scene.id] && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                        </span>
                      )}
                      {scene.is_locked && <Lock className="h-4 w-4 text-[#004D40]" />}
                      <span className="text-xs text-muted-foreground">
                        {(scene.script_text || "").split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#F0F4F4] dark:bg-muted p-4 rounded-md mb-4 border border-border/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                      Visual Cue
                    </span>
                    <p
                      className="text-sm italic text-foreground/80 focus:outline-none focus:ring-1 focus:ring-[#004D40] rounded min-h-[2rem]"
                      contentEditable={!scene.is_locked}
                      suppressContentEditableWarning
                      data-testid={`input-visual-cue-${scene.id}`}
                      onBlur={(e) => {
                        if (!scene.is_locked) handleVisualCueChange(scene.id, e.currentTarget.textContent || "");
                      }}
                    >
                      {scene.visual_cue}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#004D40] mb-2 block">
                      Voiceover Script
                    </span>
                    <p
                      className="text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-[#004D40] rounded min-h-[8rem]"
                      contentEditable={!scene.is_locked}
                      suppressContentEditableWarning
                      data-testid={`input-script-${scene.id}`}
                      onBlur={(e) => {
                        if (!scene.is_locked) handleScriptChange(scene.id, e.currentTarget.textContent || "");
                      }}
                    >
                      {scene.script_text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add scene button */}
              {!isTopicLocked && scenes.length > 0 && !generating && (
                <button
                  className="w-full py-4 border-2 border-dashed border-[#004D40] text-[#004D40] rounded-xl font-semibold hover:bg-[#004D40]/5 transition-colors flex items-center justify-center gap-2"
                  data-testid="btn-add-scene"
                  onClick={handleAddScene}
                >
                  <Plus className="h-4 w-4" /> Add Scene
                </button>
              )}
            </div>
          </div>

          {/* Finalize bar */}
          {!isTopicLocked && activeTopic && scenes.length > 0 && !generating && (
            <div className="p-4 bg-white dark:bg-card border-t border-border shrink-0">
              <div className="max-w-3xl mx-auto">
                <button
                  className="w-full py-3 rounded-md bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="btn-finalize-topic"
                  onClick={handleFinalizeTopic}
                  disabled={locking}
                >
                  {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {locking ? "Locking…" : "Finalize and Lock Topic"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel ────────────────────────────────────────────── */}
        <div className="w-72 bg-[#F0F4F4] dark:bg-sidebar border-l border-border flex flex-col shrink-0 overflow-y-auto">

          {/* Export Script */}
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg mb-3">Export Script</h2>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Download the current topic's scenes as a formatted document.
            </p>

            <div className="relative" ref={exportMenuRef}>
              <button
                data-testid="btn-export-script"
                disabled={exporting || scenes.length === 0}
                onClick={() => setExportMenuOpen((v) => !v)}
                className="w-full py-2.5 px-4 rounded-md bg-[#CCAC00] text-black font-semibold text-sm hover:bg-[#b39700] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exporting ? "Exporting…" : "Export Script"}
                {!exporting && (
                  <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", exportMenuOpen && "rotate-180")} />
                )}
              </button>

              {exportMenuOpen && (
                <div className="absolute bottom-full mb-1 left-0 w-full bg-white dark:bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    data-testid="btn-export-pdf"
                    onClick={() => handleExport("pdf")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[#F0F4F4] dark:hover:bg-muted transition-colors text-left"
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-md bg-red-50 shrink-0">
                      <FileText className="h-4 w-4 text-red-500" />
                    </span>
                    <div>
                      <div className="font-semibold">PDF Document</div>
                      <div className="text-xs text-muted-foreground">Branded A4 layout</div>
                    </div>
                  </button>
                  <div className="h-px bg-border mx-3" />
                  <button
                    data-testid="btn-export-docx"
                    onClick={() => handleExport("docx")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[#F0F4F4] dark:hover:bg-muted transition-colors text-left"
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950 shrink-0">
                      <FileType2 className="h-4 w-4 text-blue-500" />
                    </span>
                    <div>
                      <div className="font-semibold">Word Document</div>
                      <div className="text-xs text-muted-foreground">Editable .docx file</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {scenes.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Generate a topic script to export.
              </p>
            )}
          </div>

          {/* Topic stats */}
          {activeTopic && (
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-base mb-4">Topic Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scenes</span>
                  <span className="font-semibold">{scenes.length} / 6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Word count</span>
                  <span className={cn(
                    "font-semibold",
                    wordCount >= 1000 && wordCount <= 1500 ? "text-[#004D40]" : wordCount > 0 ? "text-amber-600" : ""
                  )}>
                    {wordCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="text-muted-foreground">1,000–1,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold">{activeTopic.content_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">{activeTopic.duration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Visual Storyboard */}
          <div className="p-6">
            <h2 className="font-bold text-base mb-4">Visual Storyboard</h2>
            <div className="space-y-3">
              {scenes.slice(0, 3).map((scene, i) => (
                <div
                  key={scene.id}
                  className="bg-border/30 rounded-lg aspect-video flex items-center justify-center border border-border p-2"
                >
                  <span className="text-muted-foreground text-xs font-medium text-center line-clamp-2">
                    {scene.title || `Frame ${i + 1}`}
                  </span>
                </div>
              ))}
              {scenes.length === 0 && [1, 2, 3].map((f) => (
                <div key={f} className="bg-border/30 rounded-lg aspect-video flex items-center justify-center border border-border">
                  <span className="text-muted-foreground text-xs font-medium">Frame {f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
