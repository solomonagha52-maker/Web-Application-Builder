import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlayCircle, Download, RefreshCw, Layers, Loader2, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getProjectModules,
  getModuleScenes,
  updateScene,
  addSceneToModule,
  lockModule,
  type Module,
  type Scene,
} from "@/lib/database";

export default function ScriptGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [modules, setModules] = useState<Module[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [locking, setLocking] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const loadModules = useCallback(async (pid: string) => {
    setLoadingModules(true);
    try {
      const data = await getProjectModules(pid);
      setModules(data);
      if (data.length > 0 && !activeModuleId) {
        setActiveModuleId(data[0].id);
      }
    } catch {
      toast({ title: "Could not load modules", variant: "destructive" });
    } finally {
      setLoadingModules(false);
    }
  }, [activeModuleId, toast]);

  const loadScenes = useCallback(async (moduleId: string) => {
    setLoadingScenes(true);
    try {
      const data = await getModuleScenes(moduleId);
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
    if (activeModuleId) loadScenes(activeModuleId);
  }, [activeModuleId, loadScenes]);

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
    if (!activeModuleId || !projectId) return;
    const nextNum = scenes.length > 0 ? Math.max(...scenes.map((s) => s.scene_number)) + 1 : 1;
    try {
      const newScene = await addSceneToModule(activeModuleId, projectId, nextNum);
      setScenes((prev) => [...prev, newScene]);
    } catch {
      toast({ title: "Failed to add scene", variant: "destructive" });
    }
  };

  const handleFinalizeModule = async () => {
    if (!activeModuleId) return;
    setLocking(true);
    try {
      await lockModule(activeModuleId);
      setScenes((prev) => prev.map((s) => ({ ...s, is_locked: true })));
      toast({ title: "Module finalized and locked" });
    } catch {
      toast({ title: "Failed to lock module", variant: "destructive" });
    } finally {
      setLocking(false);
    }
  };

  const isModuleLocked = scenes.length > 0 && scenes.every((s) => s.is_locked);

  if (!loadingModules && !projectId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No project selected</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Upload a PDF on the Dashboard to generate scripts automatically.
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

        {/* Left Panel — Modules */}
        <div className="w-64 bg-[#F0F4F4] border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border bg-[#F0F4F4] sticky top-0">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#004D40]" />
              Course Modules
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingModules ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#004D40]" />
              </div>
            ) : modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                No modules found. Upload a PDF first.
              </p>
            ) : (
              modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setActiveModuleId(mod.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    activeModuleId === mod.id
                      ? "bg-white border-l-4 border-[#004D40] shadow-sm text-[#004D40]"
                      : "hover:bg-black/5 text-foreground"
                  )}
                  data-testid={`btn-select-module-${mod.id}`}
                >
                  {mod.title}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center Panel — Script Editor */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-3xl mx-auto w-full space-y-6 pb-8">
              {isModuleLocked && (
                <div className="flex items-center gap-2 p-4 bg-[#004D40]/5 border border-[#004D40]/20 rounded-lg text-[#004D40] text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  This module has been finalized and locked.
                </div>
              )}

              {loadingScenes ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#004D40]" />
                </div>
              ) : scenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted-foreground text-sm">No scenes in this module yet.</p>
                  <button
                    className="mt-4 px-4 py-2 rounded-md border border-[#004D40] text-[#004D40] text-sm font-medium hover:bg-[#004D40]/5 transition-colors"
                    onClick={handleAddScene}
                  >
                    Add First Scene
                  </button>
                </div>
              ) : (
                scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={cn(
                      "bg-white border rounded-xl p-6 shadow-sm transition-colors",
                      scene.is_locked ? "border-[#004D40]/30 opacity-80" : "border-[#E5E7EB] hover:border-[#004D40]/30"
                    )}
                    data-testid={`scene-card-${scene.id}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{scene.title}</h3>
                      {saving[scene.id] && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                        </span>
                      )}
                      {scene.is_locked && (
                        <Lock className="h-4 w-4 text-[#004D40]" />
                      )}
                    </div>

                    <div className="bg-[#F0F4F4] p-4 rounded-md mb-4 border border-border/50">
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
                        className="text-base leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-[#004D40] rounded min-h-[4rem]"
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
                ))
              )}

              {!isModuleLocked && scenes.length > 0 && (
                <button
                  className="w-full py-4 border-2 border-dashed border-[#004D40] text-[#004D40] rounded-xl font-semibold hover:bg-[#004D40]/5 transition-colors flex items-center justify-center gap-2"
                  data-testid="btn-add-scene"
                  onClick={handleAddScene}
                >
                  <Plus className="h-4 w-4" /> Add Scene to Module
                </button>
              )}
            </div>
          </div>

          {/* Finalize bar */}
          {!isModuleLocked && modules.length > 0 && (
            <div className="p-4 bg-white border-t border-border">
              <div className="max-w-3xl mx-auto">
                <button
                  className="w-full py-3 rounded-md bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="btn-finalize-module"
                  onClick={handleFinalizeModule}
                  disabled={locking || scenes.length === 0}
                >
                  {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {locking ? "Locking…" : "Finalize and Lock Module"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Audio Preview */}
        <div className="w-72 bg-[#F0F4F4] border-l border-border flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg mb-6">Audio Preview</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
              <button
                className="h-16 w-16 bg-[#CCAC00] rounded-full flex items-center justify-center hover:bg-[#b39700] transition-colors shadow-md mb-4"
                data-testid="btn-play-audio"
                onClick={() => toast({ title: "Audio preview", description: "Connect a TTS API to enable audio playback." })}
              >
                <PlayCircle className="h-8 w-8 text-white fill-current" />
              </button>

              <span className="text-sm font-semibold bg-black/5 px-3 py-1 rounded-full mb-4">
                Neural Voice Pro
              </span>

              <div className="w-full space-y-2 mb-6">
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-[#004D40] w-1/3 rounded-full" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>0:00</span>
                  <span>—:——</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  className="py-2 text-xs font-semibold rounded-md border border-[#004D40] text-[#004D40] hover:bg-black/5 transition-colors flex items-center justify-center gap-1"
                  data-testid="btn-resync"
                  onClick={() => toast({ title: "Re-sync", description: "Audio sync requires a TTS API connection." })}
                >
                  <RefreshCw className="h-3 w-3" /> Resync
                </button>
                <button
                  className="py-2 text-xs font-semibold rounded-md bg-[#CCAC00] text-black hover:bg-[#b39700] transition-colors flex items-center justify-center gap-1 shadow-sm"
                  data-testid="btn-export-audio"
                  onClick={() => toast({ title: "Export", description: "Audio export requires a TTS API connection." })}
                >
                  <Download className="h-3 w-3" /> Export
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-bold text-lg mb-4">Visual Storyboard</h2>
            <div className="space-y-4">
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
                  <span className="text-muted-foreground text-xs font-medium">Frame {f} placeholder</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
