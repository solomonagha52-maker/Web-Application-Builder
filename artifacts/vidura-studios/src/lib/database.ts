import { supabase } from "./supabase";
import type { GeneratedCourse, CourseScene } from "./ai";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  pdf_url: string | null;
  status: "processing" | "ready" | "locked";
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Topic {
  id: string;
  module_id: string;
  title: string;
  content_type: "Video" | "Reading";
  duration: string;
  order_index: number;
}

export interface Scene {
  id: string;
  module_id: string;
  topic_id: string | null;
  project_id: string;
  scene_number: number;
  title: string;
  visual_cue: string;
  script_text: string;
  is_locked: boolean;
  updated_at?: string;
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error) return null;
  return data as Project;
}

export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Project[];
}

export async function createProject(
  userId: string,
  title: string,
  subject: string,
  pdfUrl: string | null
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, title, subject, pdf_url: pdfUrl, status: "processing", progress: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function getProjectModules(projectId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index");
  if (error) throw error;
  return (data || []) as Module[];
}

export async function getModuleTopics(moduleId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("module_id", moduleId)
    .order("order_index");
  if (error) throw error;
  return (data || []) as Topic[];
}

export async function getTopicScenes(topicId: string): Promise<Scene[]> {
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("topic_id", topicId)
    .order("scene_number");
  if (error) throw error;
  return (data || []) as Scene[];
}

export async function saveTopicScenes(
  topicId: string,
  moduleId: string,
  projectId: string,
  scenes: CourseScene[]
): Promise<Scene[]> {
  // Remove any existing scenes for this topic first
  await supabase.from("scenes").delete().eq("topic_id", topicId);

  const toInsert = scenes.map((s) => ({
    topic_id: topicId,
    module_id: moduleId,
    project_id: projectId,
    scene_number: s.scene_number,
    title: s.title,
    visual_cue: s.visual_cue,
    script_text: s.script_text,
    is_locked: false,
  }));

  const { data, error } = await supabase
    .from("scenes")
    .insert(toInsert)
    .select();
  if (error) throw error;
  return (data || []) as Scene[];
}

export async function updateScene(sceneId: string, updates: Partial<Scene>): Promise<void> {
  const { error } = await supabase
    .from("scenes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", sceneId);
  if (error) throw error;
}

export async function lockTopic(topicId: string): Promise<void> {
  const { error } = await supabase
    .from("scenes")
    .update({ is_locked: true })
    .eq("topic_id", topicId);
  if (error) throw error;
}

export async function lockModule(moduleId: string): Promise<void> {
  const { error } = await supabase
    .from("scenes")
    .update({ is_locked: true })
    .eq("module_id", moduleId);
  if (error) throw error;
}

export async function addSceneToTopic(
  topicId: string,
  moduleId: string,
  projectId: string,
  sceneNumber: number
): Promise<Scene> {
  const { data, error } = await supabase
    .from("scenes")
    .insert({
      topic_id: topicId,
      module_id: moduleId,
      project_id: projectId,
      scene_number: sceneNumber,
      title: `Scene ${sceneNumber}: New Scene`,
      visual_cue: "Describe what should be shown on screen during this narration.",
      script_text: "Enter the voiceover script for this scene here.",
      is_locked: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Scene;
}

// Legacy — kept for backwards compat with old data that stored scenes at module level
export async function getModuleScenes(moduleId: string): Promise<Scene[]> {
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("module_id", moduleId)
    .is("topic_id", null)
    .order("scene_number");
  if (error) throw error;
  return (data || []) as Scene[];
}

export async function addSceneToModule(
  moduleId: string,
  projectId: string,
  sceneNumber: number
): Promise<Scene> {
  const { data, error } = await supabase
    .from("scenes")
    .insert({
      module_id: moduleId,
      project_id: projectId,
      scene_number: sceneNumber,
      title: `Scene ${sceneNumber}: New Scene`,
      visual_cue: "Describe what should be shown on screen during this narration.",
      script_text: "Enter the voiceover script for this scene here.",
      is_locked: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Scene;
}

// Saves structure only — scenes are generated per-topic on demand
export async function saveAIResults(
  projectId: string,
  courseData: GeneratedCourse
): Promise<void> {
  for (let mi = 0; mi < courseData.modules.length; mi++) {
    const mod = courseData.modules[mi];

    const { data: moduleData, error: modError } = await supabase
      .from("modules")
      .insert({ project_id: projectId, title: mod.title, order_index: mi })
      .select()
      .single();
    if (modError) throw modError;

    const moduleId = (moduleData as Module).id;

    const topicsToInsert = (mod.topics || []).map((t, ti) => ({
      module_id: moduleId,
      title: t.title,
      content_type: t.content_type,
      duration: t.duration,
      order_index: ti,
    }));
    if (topicsToInsert.length > 0) {
      const { error } = await supabase.from("topics").insert(topicsToInsert);
      if (error) throw error;
    }
  }

  await updateProject(projectId, {
    status: "ready",
    progress: 10,
    title: courseData.title,
    subject: courseData.subject,
  });
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}/avatar.${ext}`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(data.path);
  return publicUrl;
}

export async function uploadPdf(userId: string, file: File): Promise<string | null> {
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${userId}/${Date.now()}-${sanitized}`;

  const { data, error } = await supabase.storage
    .from("pdfs")
    .upload(fileName, file, { contentType: "application/pdf", upsert: false });

  if (error) {
    console.warn("PDF storage upload failed:", error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("pdfs").getPublicUrl(data.path);
  return publicUrl;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
