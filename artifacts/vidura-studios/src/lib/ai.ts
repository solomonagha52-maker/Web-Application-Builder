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
  const maxPages = Math.min(pdf.numPages, 40);
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
  const prompt = `You are a professional script writer and expert educational course designer.

Analyze the academic content below and generate a fully structured online course.

STRICT REQUIREMENTS — follow every rule exactly:
1. Generate EXACTLY 5 modules. No more, no fewer.
2. Each module must contain EXACTLY 4 topics.
3. Each module must contain EXACTLY 3 scenes, giving 15 scenes total across the course.
4. Every scene's script_text must be 5 to 7 complete, detailed sentences written as polished voiceover narration. Each sentence must be substantive, informative, and specific to the subject matter — no vague filler.
5. Every scene's visual_cue must be a vivid, production-ready description of what appears on screen during that narration (animated diagrams, charts, footage, text overlays, etc.).
6. Topics must have comprehensive titles that reflect actual content from the source material.
7. The total reading time of all script_text combined must be between 9 and 10 minutes (approximately 1,350 to 1,500 words across all 15 scenes).
8. Base all content firmly on the provided academic material — be specific, accurate, and educational.
9. Use a clear, engaging instructional tone throughout.

Return ONLY a valid JSON object. No markdown. No explanation. No code fences. Just the raw JSON.

Use this EXACT structure:

{
  "title": "Full Course Title",
  "subject": "Subject Area",
  "modules": [
    {
      "title": "Module 1: Descriptive Title",
      "topics": [
        { "title": "Topic 1 Title", "content_type": "Video", "duration": "12m" },
        { "title": "Topic 2 Title", "content_type": "Reading", "duration": "10m" },
        { "title": "Topic 3 Title", "content_type": "Video", "duration": "14m" },
        { "title": "Topic 4 Title", "content_type": "Reading", "duration": "8m" }
      ],
      "scenes": [
        {
          "scene_number": 1,
          "title": "Scene 1: Introduction to [Specific Concept]",
          "visual_cue": "Opening title animation fades in against a deep navy background. An animated infographic unfolds showing the key components of the topic with labeled callouts and connecting arrows.",
          "script_text": "Welcome to Module 1, where we begin our exploration of [specific subject]. This module lays the conceptual groundwork that everything else in the course builds upon. [Specific concept from content] is a foundational idea that emerged from [relevant context], and understanding it precisely is essential for any serious practitioner. In this scene, we will walk through the core definition, examine why it matters in real-world settings, and identify the key variables at play. By the end of this module, you will have the analytical vocabulary and conceptual clarity to engage confidently with the more advanced topics that follow."
        },
        {
          "scene_number": 2,
          "title": "Scene 2: [Specific Sub-topic]",
          "visual_cue": "Split-screen diagram comparing two contrasting approaches side by side. Text callouts highlight key differences with color-coded indicators.",
          "script_text": "..."
        },
        {
          "scene_number": 3,
          "title": "Scene 3: [Application or Case Study]",
          "visual_cue": "Step-by-step animated walkthrough showing a real-world application of the concept with numbered stages and annotated examples.",
          "script_text": "..."
        }
      ]
    }
  ]
}

Academic Content:
${pdfText.substring(0, 9000)}`;

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

  const makeScene = (num: number, moduleNum: number, moduleTitle: string, sceneTitle: string, cue: string, script: string): CourseScene => ({
    scene_number: num,
    title: `Scene ${num}: ${sceneTitle}`,
    visual_cue: cue,
    script_text: script,
  });

  return {
    title,
    subject: "General Studies",
    modules: [
      {
        title: "Module 1: Foundations and Core Principles",
        topics: [
          { title: "Historical Context and Origins", content_type: "Video", duration: "12m" },
          { title: "Fundamental Definitions and Key Terminology", content_type: "Reading", duration: "10m" },
          { title: "Core Theoretical Frameworks", content_type: "Video", duration: "14m" },
          { title: "Principles in Modern Practice", content_type: "Reading", duration: "8m" },
        ],
        scenes: [
          makeScene(1, 1, "Module 1", "Welcome and Course Overview",
            "Animated title card with course name fades in over a clean studio backdrop. A roadmap graphic appears showing all five modules with connecting milestones.",
            `Welcome to ${title}, a comprehensive course designed to take you from foundational understanding to expert-level application. This course has been carefully structured across five modules, each building on the last to develop a complete and coherent mastery of the subject. Throughout our time together, you will encounter key theories, real-world examples, and practical frameworks that practitioners in this field rely on every day. Whether you are approaching this material for the first time or returning to deepen existing knowledge, this course is designed to meet you at your level and push you further. By the time we reach the final module, you will have the analytical tools, conceptual clarity, and practical confidence to apply this knowledge in professional and academic contexts. Let us begin.`),
          makeScene(2, 1, "Module 1", "Historical Context and Origins",
            "Timeline animation scrolling through key historical milestones, with dates, names, and events appearing as illustrated cards.",
            `Understanding where a field comes from is essential to understanding where it is going. The history of this subject stretches back centuries, shaped by pivotal discoveries, influential thinkers, and the pressing demands of each era. Early practitioners worked without the tools we now take for granted, yet their foundational observations remain the bedrock on which modern understanding is built. As we trace this historical arc, pay close attention to the moments where conventional thinking was challenged — these turning points often reveal the deepest truths about how knowledge in this field actually advances. The lessons of history are not merely academic; they provide a strategic lens through which contemporary challenges can be understood and addressed with greater sophistication.`),
          makeScene(3, 1, "Module 1", "Core Principles Explained",
            "Animated diagram breaking down core principles into layered components, each revealed one at a time with descriptive callouts.",
            `With historical context established, we can now examine the core principles that govern this field with precision and depth. These principles are not arbitrary rules — they are the distilled result of centuries of observation, experimentation, and refinement. Each principle interacts with the others in ways that are both predictable and nuanced, and recognizing these interactions is what separates surface-level familiarity from genuine expertise. We will work through each principle systematically, examining its definition, its underlying logic, and the real-world conditions under which it holds most powerfully. As you absorb this material, consider how each principle manifests in contexts you are already familiar with — that bridge between theory and lived experience is where understanding truly takes root.`),
        ],
      },
      {
        title: "Module 2: Theoretical Frameworks in Depth",
        topics: [
          { title: "Primary Theoretical Models", content_type: "Video", duration: "15m" },
          { title: "Comparative Analysis of Frameworks", content_type: "Reading", duration: "12m" },
          { title: "Strengths, Limitations, and Edge Cases", content_type: "Video", duration: "13m" },
          { title: "Selecting the Right Framework for Context", content_type: "Reading", duration: "9m" },
        ],
        scenes: [
          makeScene(4, 2, "Module 2", "Introducing the Major Frameworks",
            "Side-by-side comparison of three theoretical frameworks displayed as structured diagrams with labeled components and color-coded categories.",
            `Module 2 takes us into the theoretical landscape that underpins this field, where we will examine the major frameworks that scholars and practitioners have developed to make sense of complex phenomena. A theoretical framework is not merely an academic exercise — it is a powerful tool for organizing information, generating hypotheses, and guiding decisions in the face of uncertainty. We will begin by mapping out the primary frameworks in use today, tracing their intellectual origins and the specific problems each was designed to solve. As you will see, no single framework provides a complete picture; each carries assumptions, strengths, and blind spots that become visible only when you step back and compare them. Developing fluency across multiple frameworks is one of the most valuable skills you can cultivate in this field.`),
          makeScene(5, 2, "Module 2", "Comparative Analysis",
            "Animated table populating row by row comparing frameworks across key criteria: scope, assumptions, predictive power, and practical application.",
            `Comparing theoretical frameworks side by side reveals patterns that would otherwise remain hidden when studying each in isolation. The most productive comparisons focus not on which framework is superior in the abstract, but on which is best suited to specific types of problems and contexts. Some frameworks excel at capturing broad systemic dynamics but sacrifice granular precision; others offer microscopic detail at the cost of generalizability. By working through structured comparisons across several key dimensions — scope, underlying assumptions, predictive power, and ease of practical application — you will develop the evaluative judgment that expert practitioners use when selecting their analytical tools. This comparative literacy is what allows you to move fluidly between frameworks as the demands of a problem change.`),
          makeScene(6, 2, "Module 2", "Applying Frameworks to Real Problems",
            "Animated case walkthrough showing a real-world scenario being analyzed through two different frameworks, with contrasting conclusions highlighted.",
            `Theory becomes most illuminating when it is brought into contact with real problems. In this scene, we walk through a detailed scenario — drawn from actual practice in this field — and apply two contrasting frameworks to analyze it. Watch carefully as the same set of facts yields different diagnoses depending on the framework applied; this is not a flaw but a feature, revealing the assumptions that each framework embeds. The goal is not to find the one correct answer but to understand how framing shapes interpretation and, ultimately, the decisions that follow. Practitioners who can consciously shift between frameworks are better equipped to challenge their own assumptions, anticipate blind spots, and arrive at more robust and defensible conclusions.`),
        ],
      },
      {
        title: "Module 3: Practical Applications and Methodology",
        topics: [
          { title: "Research Design and Methodological Approaches", content_type: "Video", duration: "16m" },
          { title: "Data Collection and Analysis Techniques", content_type: "Reading", duration: "11m" },
          { title: "Case Studies: Method in Action", content_type: "Video", duration: "18m" },
          { title: "Common Pitfalls and How to Avoid Them", content_type: "Reading", duration: "10m" },
        ],
        scenes: [
          makeScene(7, 3, "Module 3", "From Theory to Method",
            "Flowchart animation showing the research design process from question formulation through data collection, analysis, and interpretation.",
            `Module 3 bridges the gap between theoretical understanding and practical execution, focusing on the methodological approaches that allow you to generate reliable knowledge in this field. A strong methodology is not a bureaucratic requirement — it is the architecture that determines whether your findings will hold up under scrutiny and be useful to others. We begin by examining how research questions are formulated and how the nature of a question shapes the methods appropriate for answering it. The relationship between theory, method, and evidence is iterative rather than linear: methods inform what evidence is visible, evidence challenges theory, and refined theory suggests new methods. Understanding this cycle deeply is what separates rigorous practitioners from those who merely follow procedures without comprehending why.`),
          makeScene(8, 3, "Module 3", "Data Collection and Analysis",
            "Step-by-step animated graphic showing data collection pipeline with labeled stages, data types, and analysis tools at each stage.",
            `With a sound methodological framework in place, we turn to the practical mechanics of data collection and analysis. Every data collection decision — what to measure, how to measure it, from whom, and under what conditions — carries implications for the quality and interpretability of your findings. Quantitative approaches offer precision and statistical power but require carefully controlled conditions and large samples; qualitative approaches provide depth, nuance, and access to meaning but demand rigorous interpretive discipline. Mixed-method designs can leverage the strengths of both, though they require greater methodological fluency to execute well. In this scene, we walk through the key decision points in designing a data collection strategy and examine the analytical techniques most commonly applied once data has been gathered.`),
          makeScene(9, 3, "Module 3", "Case Study: Method in Action",
            "Documentary-style walkthrough of a full case study, with on-screen annotations marking methodological decisions at each stage.",
            `Nothing consolidates methodological understanding more effectively than seeing it applied to a complete, real-world case. In this extended scene, we trace the full arc of a study from this field — from the initial research question through data collection, analysis, and the interpretation of findings. At each stage, we pause to examine the methodological choices made and the reasoning behind them, including where alternative approaches were considered and rejected. This kind of forensic engagement with real research is invaluable because it reveals the messy, judgment-laden reality of practice that textbook descriptions often smooth over. By the end of this scene, you will have a concrete reference point — a mental model of rigorous practice — that you can draw on when designing your own investigations.`),
        ],
      },
      {
        title: "Module 4: Advanced Concepts and Current Developments",
        topics: [
          { title: "Emerging Trends and Contemporary Debates", content_type: "Video", duration: "14m" },
          { title: "Advanced Analytical Techniques", content_type: "Video", duration: "17m" },
          { title: "Interdisciplinary Connections", content_type: "Reading", duration: "10m" },
          { title: "Critical Perspectives and Challenges", content_type: "Reading", duration: "12m" },
        ],
        scenes: [
          makeScene(10, 4, "Module 4", "Emerging Trends",
            "Animated news-feed style layout with highlighted articles, research paper titles, and trend graphs appearing in sequence.",
            `Module 4 moves us into the frontier of this field, where established knowledge meets emerging inquiry and the boundaries of understanding are actively being contested and expanded. Staying current in any dynamic discipline requires more than reading the latest publications — it requires understanding which debates are fundamental and which are peripheral, and developing the judgment to evaluate new claims against the weight of existing evidence. The trends we examine in this module are not fleeting novelties; they represent genuine shifts in how practitioners understand and engage with core problems. As you work through this material, practice asking not just what the new finding is, but what assumptions it challenges, what evidence supports it, and what implications it carries for established practice.`),
          makeScene(11, 4, "Module 4", "Advanced Analytical Techniques",
            "Technical diagram showing advanced analytical workflow with labeled decision trees, statistical models, and output interpretations.",
            `Advanced analytical techniques extend the practitioner's capacity to extract insight from complex, high-dimensional, or ambiguous data. In this scene, we introduce several methods that go beyond standard approaches, examining both their technical mechanics and the conditions under which each is most appropriately deployed. It is important to approach advanced techniques with a clear-eyed understanding of their requirements: more sophisticated methods often demand more from the analyst in terms of background knowledge, data quality, and interpretive care. A powerful technique misapplied produces results that are worse than useless — they are actively misleading. We will therefore spend as much time on the conditions and limitations of each technique as on the mechanics of its application.`),
          makeScene(12, 4, "Module 4", "Interdisciplinary Connections and Critical Perspectives",
            "Concept map showing connections between this field and adjacent disciplines, with labeled bridges highlighting shared methods and complementary insights.",
            `No field of knowledge exists in isolation, and some of the most generative advances in this discipline have come from encounters with adjacent fields that offered fresh conceptual tools or challenging perspectives. Interdisciplinary thinking is not about diluting expertise — it is about strategically expanding your analytical repertoire by borrowing ideas that have proven powerful elsewhere. Alongside these productive connections, we must also engage seriously with the critical perspectives that challenge mainstream assumptions within the field itself. Criticism, when grounded in evidence and rigorous argument, is not an obstacle to progress but the primary engine of it. This scene equips you to engage with both interdisciplinary opportunities and internal debates with the openness and critical rigour that genuine scholarly practice demands.`),
        ],
      },
      {
        title: "Module 5: Synthesis, Reflection, and Professional Application",
        topics: [
          { title: "Integrating Knowledge Across the Course", content_type: "Video", duration: "13m" },
          { title: "Professional Ethics and Responsibility", content_type: "Reading", duration: "10m" },
          { title: "Building Your Practice: Tools and Resources", content_type: "Video", duration: "11m" },
          { title: "Capstone Reflection and Continuing Development", content_type: "Reading", duration: "9m" },
        ],
        scenes: [
          makeScene(13, 5, "Module 5", "Integrating the Course",
            "Animated recap graphic revisiting key concepts from all previous modules with connecting arrows showing how ideas relate across the curriculum.",
            `We arrive now at the final module, where our task is not to add more content but to synthesize — to weave the threads from all four preceding modules into a coherent and usable understanding. Synthesis is a demanding intellectual exercise because it requires you to move beyond memorization and recall into genuine comprehension: understanding not just what each idea is, but how it relates to and conditions the others. As we work through this integration, you will likely notice connections you did not see earlier and perhaps some tensions between ideas that warrant further thought. This is a sign of deepening understanding, not confusion. The goal of this scene is to leave you with a unified mental map of the field that will serve as a durable foundation for everything you encounter professionally and academically going forward.`),
          makeScene(14, 5, "Module 5", "Ethics, Responsibility, and Professional Standards",
            "Scenario-based animation presenting ethical dilemmas with decision-point branching and annotated consequences for each choice.",
            `Professional practice in this field carries ethical responsibilities that cannot be reduced to rule-following or compliance checklists. Ethics in serious professional work is a living, contextual discipline — it requires ongoing judgment, genuine commitment to the well-being of those affected by your work, and the intellectual honesty to acknowledge uncertainty and limitation. We examine the core ethical principles that govern this field, explore several real-world scenarios where those principles come under pressure, and discuss the frameworks practitioners use to navigate genuinely difficult decisions. The aim is not to provide a rulebook but to develop your ethical reasoning capacity — the ability to think clearly and act with integrity even in situations where the right course of action is genuinely ambiguous.`),
          makeScene(15, 5, "Module 5", "Your Path Forward",
            "Roadmap animation showing future learning pathways, professional development opportunities, and a final course milestone graphic.",
            `As we bring this course to a close, the most important thing to understand is that completing it is a beginning, not an end. The knowledge and frameworks you have built here are tools that grow sharper and more useful with practice, reflection, and continued engagement with new ideas and challenges in the field. In this final scene, we outline the key resources, communities of practice, and learning pathways that will support your ongoing development. We also reflect briefly on the disposition that characterizes the best practitioners in this field: intellectual curiosity, methodological rigour, ethical seriousness, and the humility to keep learning. You have built a strong foundation. What you build on top of it is up to you. Congratulations on completing ${title}.`),
        ],
      },
    ],
  };
}
