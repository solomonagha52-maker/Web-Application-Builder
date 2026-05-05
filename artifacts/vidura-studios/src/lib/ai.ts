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
  scenes: CourseScene[];
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
  const maxPages = Math.min(pdf.numPages, 25);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is { str: string } => "str" in item)
      .map((item) => item.str)
      .join(" ");
    text += pageText + "\n";
  }

  return text.trim();
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/ai/health", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = await res.json() as { status: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}

export async function generateCourseStructure(pdfText: string): Promise<GeneratedCourse> {
  const prompt = `You are an expert educational course designer. Analyze the following academic content and generate a structured online course.

Return ONLY a valid JSON object with this EXACT structure — no markdown, no explanation, just JSON:

{
  "title": "Course Title",
  "subject": "Subject Area",
  "modules": [
    {
      "title": "Module 1: Title",
      "topics": [
        { "title": "Topic Name", "content_type": "Video", "duration": "10m" },
        { "title": "Topic Name", "content_type": "Reading", "duration": "8m" }
      ],
      "scenes": [
        {
          "scene_number": 1,
          "title": "Scene 1: Introduction",
          "visual_cue": "Show animated diagram illustrating the core concept",
          "script_text": "Welcome to this module. Today we will explore the fundamental principles that underpin this subject and build a solid foundation for the lessons ahead."
        },
        {
          "scene_number": 2,
          "title": "Scene 2: Core Concepts",
          "visual_cue": "Display a step-by-step breakdown with numbered callouts",
          "script_text": "Let us now examine the key ideas in detail. Each concept builds on the previous, creating a coherent framework for understanding."
        }
      ]
    }
  ]
}

Requirements:
- Create 3 to 5 modules based on the content
- Each module: 2 to 4 topics, 2 to 3 scenes
- Scene script_text should be 2 to 4 sentences, written for a voiceover narrator
- Visual cues should describe what appears on screen during the narration
- Base everything on the actual provided content

Academic Content:
${pdfText.substring(0, 5000)}`;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt,
      stream: false,
      format: "json",
    }),
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
        title: "Module 1: Foundations and Overview",
        topics: [
          { title: "Introduction and Context", content_type: "Video", duration: "12m" },
          { title: "Core Principles", content_type: "Reading", duration: "10m" },
          { title: "Key Terminology", content_type: "Reading", duration: "8m" },
        ],
        scenes: [
          {
            scene_number: 1,
            title: "Scene 1: Welcome",
            visual_cue: "Animated title card with course name and a professional studio background.",
            script_text: `Welcome to ${title}. This course has been designed to give you a comprehensive understanding of the subject from the ground up. Whether you are a beginner or looking to deepen your expertise, this material will guide you step by step.`,
          },
          {
            scene_number: 2,
            title: "Scene 2: What You Will Learn",
            visual_cue: "Bullet point list appearing one by one on a clean white board.",
            script_text: "Over the course of these modules, we will cover the core principles, examine real-world applications, and build the analytical skills you need to succeed. By the end, you will have a solid framework you can apply in both academic and professional contexts.",
          },
        ],
      },
      {
        title: "Module 2: Core Concepts in Depth",
        topics: [
          { title: "Theoretical Frameworks", content_type: "Video", duration: "15m" },
          { title: "Practical Applications", content_type: "Video", duration: "18m" },
          { title: "Case Study Analysis", content_type: "Reading", duration: "12m" },
        ],
        scenes: [
          {
            scene_number: 1,
            title: "Scene 1: Theory and Practice",
            visual_cue: "Split screen comparing theoretical diagrams on the left with real-world images on the right.",
            script_text: "Theory without practice is incomplete. In this module, we bridge the gap between abstract concepts and their tangible applications. You will see how foundational ideas translate into real decisions and real outcomes.",
          },
          {
            scene_number: 2,
            title: "Scene 2: Case Study",
            visual_cue: "Timeline animation showing the progression of a case study scenario.",
            script_text: "Let us walk through a detailed case study that illustrates these principles in action. Pay attention to the decision points and the reasoning behind each choice — these are the moments where theory becomes expertise.",
          },
        ],
      },
      {
        title: "Module 3: Advanced Topics and Next Steps",
        topics: [
          { title: "Advanced Methodologies", content_type: "Video", duration: "20m" },
          { title: "Industry Standards", content_type: "Reading", duration: "10m" },
          { title: "Capstone Summary", content_type: "Video", duration: "8m" },
        ],
        scenes: [
          {
            scene_number: 1,
            title: "Scene 1: Going Deeper",
            visual_cue: "Layered diagram revealing deeper levels of complexity beneath a simple surface concept.",
            script_text: "Now that we have established a strong foundation, it is time to explore the more nuanced and advanced dimensions of this field. These are the concepts that separate competent practitioners from true experts.",
          },
          {
            scene_number: 2,
            title: "Scene 2: Summary and Path Forward",
            visual_cue: "Roadmap graphic showing completed milestones and future learning paths.",
            script_text: "Congratulations on reaching the final module. Let us recap everything we have covered and outline the next steps in your learning journey. The skills you have built here are the foundation for everything that comes next.",
          },
        ],
      },
    ],
  };
}
