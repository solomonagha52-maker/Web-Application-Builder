export interface CourseScene {
  scene_number: number;
  title: string;
  visual_cue: string;
  script_text: string;
}

export interface CourseTopic {
  title: string;
  content_type: "Video" | "Reading";
  duration: string;
}

export interface CourseModule {
  title: string;
  topics: CourseTopic[];
}

export interface GeneratedCourse {
  title: string;
  subject: string;
  modules: CourseModule[];
}

export async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  let text = "";
  const maxPages = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ");
    text += pageText + "\n";
  }

  return text.trim();
}

export async function checkAIHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/ai/health", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = await res.json() as { status: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}

// Keep old name as alias for backwards compat
export const checkOllamaHealth = checkAIHealth;

// ── Structure generation (fast — no scenes, just modules + topics) ─
export async function generateCourseStructure(pdfText: string): Promise<GeneratedCourse> {
  const prompt = `You are a professional script writer and expert educational course designer.

Analyze the academic content below and generate a structured course outline.

STRICT REQUIREMENTS:
1. Generate between 5 and 10 modules based on the complexity and depth of the content. More complex content warrants more modules.
2. Each module must contain EXACTLY 5 topics.
3. Do NOT include scenes — this is a structure outline only.
4. Module titles must be descriptive and specific to the content.
5. Topic titles must be detailed, informative, and reflect real sub-topics from the source material.
6. Assign realistic durations (12m–25m for Video, 8m–20m for Reading) based on topic depth.
7. Base everything on the actual provided content — be specific, not generic.

Return ONLY a valid JSON object. No markdown. No code fences. No explanation. Raw JSON only.

Exact structure to follow:
{
  "title": "Full Course Title",
  "subject": "Subject Area",
  "modules": [
    {
      "title": "Module 1: Descriptive Title",
      "topics": [
        { "title": "Specific Topic Title", "content_type": "Video", "duration": "15m" },
        { "title": "Specific Topic Title", "content_type": "Reading", "duration": "12m" },
        { "title": "Specific Topic Title", "content_type": "Video", "duration": "18m" },
        { "title": "Specific Topic Title", "content_type": "Reading", "duration": "10m" },
        { "title": "Specific Topic Title", "content_type": "Video", "duration": "14m" }
      ]
    }
  ]
}

Academic Content:
${pdfText.substring(0, 9000)}`;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `AI proxy error: ${response.status}`);
  }

  const data = await response.json() as { response?: string };
  const raw = data.response || "";

  try {
    return JSON.parse(raw) as GeneratedCourse;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as GeneratedCourse;
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ── Per-topic script generation (6 scenes, 3,000–5,000 words) ─────
export async function generateTopicScript(
  courseTitle: string,
  moduleTitle: string,
  topicTitle: string,
  topicIndex: number,
  pdfContext: string
): Promise<CourseScene[]> {
  const prompt = `You are a professional script writer creating a detailed educational video script.

Course: "${courseTitle}"
Module: "${moduleTitle}"
Topic ${topicIndex + 1}: "${topicTitle}"

STRICT REQUIREMENTS:
1. Generate EXACTLY 6 scenes for this topic.
2. The combined script_text across all 6 scenes must be between 3,000 and 5,000 words.
3. Each scene's script_text must be between 500 and 833 words — rich, detailed, educational narration written in a clear and engaging instructional voice.
4. Each scene must cover a distinct aspect or sub-section of the topic.
5. Scene progression must flow logically: introduction → core concepts → detailed explanation → examples/applications → analysis → synthesis/summary.
6. Each visual_cue must be a vivid, production-ready description of on-screen content (animated diagrams, data visualisations, case footage, step-by-step breakdowns, comparison charts, etc.).
7. Be specific to the topic — no vague filler. Every sentence must carry genuine educational value.
8. Write as polished, professional voiceover narration throughout.

${pdfContext ? `Reference material:\n${pdfContext.substring(0, 4000)}\n\n` : ""}

Return a JSON object with a single key "scenes" whose value is an array of exactly 6 scene objects. No markdown. No code fences. No explanation. Raw JSON only.

Exact structure:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "Scene 1: Introduction to [specific aspect]",
      "visual_cue": "Detailed description of what appears on screen during this narration.",
      "script_text": "Full 500–833 word voiceover narration for this scene..."
    },
    {
      "scene_number": 2,
      "title": "Scene 2: [specific sub-topic]",
      "visual_cue": "Detailed production-ready visual description.",
      "script_text": "Full 500–833 word voiceover narration..."
    },
    {
      "scene_number": 3,
      "title": "Scene 3: [specific sub-topic]",
      "visual_cue": "Detailed production-ready visual description.",
      "script_text": "Full 500–833 word voiceover narration..."
    },
    {
      "scene_number": 4,
      "title": "Scene 4: [specific sub-topic]",
      "visual_cue": "Detailed production-ready visual description.",
      "script_text": "Full 500–833 word voiceover narration..."
    },
    {
      "scene_number": 5,
      "title": "Scene 5: [specific sub-topic]",
      "visual_cue": "Detailed production-ready visual description.",
      "script_text": "Full 500–833 word voiceover narration..."
    },
    {
      "scene_number": 6,
      "title": "Scene 6: Synthesis and Key Takeaways",
      "visual_cue": "Detailed production-ready visual description.",
      "script_text": "Full 500–833 word voiceover narration..."
    }
  ]
}`;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `AI proxy error: ${response.status}`);
  }

  const data = await response.json() as { response?: string };
  const raw = data.response || "";

  // Parse and extract the scenes array from the { "scenes": [...] } wrapper
  const extractScenes = (value: unknown): CourseScene[] | null => {
    if (Array.isArray(value)) return value as CourseScene[];
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      // Check explicit "scenes" key first (matches our prompt format)
      if (Array.isArray(obj["scenes"])) return obj["scenes"] as CourseScene[];
      // Fall back: find any array-valued key
      const key = Object.keys(obj).find((k) => Array.isArray(obj[k]));
      if (key) return obj[key] as CourseScene[];
    }
    return null;
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try pulling a JSON block out of any surrounding text
    const objMatch = raw.match(/\{[\s\S]*\}/);
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (objMatch) {
      try { parsed = JSON.parse(objMatch[0]); } catch { /* ignore */ }
    }
    if (!parsed && arrMatch) {
      try { parsed = JSON.parse(arrMatch[0]); } catch { /* ignore */ }
    }
  }

  const scenes = extractScenes(parsed);
  if (scenes && scenes.length > 0) return scenes;

  throw new Error("AI response did not contain a valid scene array");
}

export function generateMockCourse(filename: string): GeneratedCourse {
  const title = filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title,
    subject: "General Studies",
    modules: [
      {
        title: "Module 1: Foundations and Core Principles",
        topics: [
          { title: "Historical Context and Origins", content_type: "Video", duration: "14m" },
          { title: "Fundamental Definitions and Key Terminology", content_type: "Reading", duration: "12m" },
          { title: "Core Theoretical Frameworks", content_type: "Video", duration: "18m" },
          { title: "Principles in Modern Practice", content_type: "Reading", duration: "10m" },
          { title: "Critical Analysis of Foundational Ideas", content_type: "Video", duration: "15m" },
        ],
      },
      {
        title: "Module 2: Theoretical Frameworks in Depth",
        topics: [
          { title: "Primary Theoretical Models", content_type: "Video", duration: "16m" },
          { title: "Comparative Analysis of Frameworks", content_type: "Reading", duration: "13m" },
          { title: "Strengths, Limitations, and Edge Cases", content_type: "Video", duration: "14m" },
          { title: "Selecting the Right Framework for Context", content_type: "Reading", duration: "11m" },
          { title: "Framework Application: Worked Examples", content_type: "Video", duration: "20m" },
        ],
      },
      {
        title: "Module 3: Practical Applications and Methodology",
        topics: [
          { title: "Research Design and Methodological Approaches", content_type: "Video", duration: "17m" },
          { title: "Data Collection and Analysis Techniques", content_type: "Reading", duration: "12m" },
          { title: "Case Studies: Method in Action", content_type: "Video", duration: "22m" },
          { title: "Common Pitfalls and How to Avoid Them", content_type: "Reading", duration: "10m" },
          { title: "Evaluating and Interpreting Results", content_type: "Video", duration: "15m" },
        ],
      },
      {
        title: "Module 4: Advanced Concepts and Current Developments",
        topics: [
          { title: "Emerging Trends and Contemporary Debates", content_type: "Video", duration: "14m" },
          { title: "Advanced Analytical Techniques", content_type: "Video", duration: "19m" },
          { title: "Interdisciplinary Connections", content_type: "Reading", duration: "11m" },
          { title: "Critical Perspectives and Challenges", content_type: "Reading", duration: "13m" },
          { title: "Future Directions in the Field", content_type: "Video", duration: "16m" },
        ],
      },
      {
        title: "Module 5: Synthesis, Reflection, and Professional Application",
        topics: [
          { title: "Integrating Knowledge Across the Course", content_type: "Video", duration: "14m" },
          { title: "Professional Ethics and Responsibility", content_type: "Reading", duration: "11m" },
          { title: "Building Your Practice: Tools and Resources", content_type: "Video", duration: "12m" },
          { title: "Capstone Reflection and Continuing Development", content_type: "Reading", duration: "10m" },
          { title: "Preparing for Real-World Application", content_type: "Video", duration: "18m" },
        ],
      },
    ],
  };
}
