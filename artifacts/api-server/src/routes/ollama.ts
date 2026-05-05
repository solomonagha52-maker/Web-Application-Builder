import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

// ── OpenAI client (Replit-proxied, no user key needed) ────────
function getOpenAIClient() {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) throw new Error("OpenAI integration not configured");
  return new OpenAI({ baseURL, apiKey });
}

// ── Ollama base URL (optional override) ───────────────────────
function getOllamaUrl() {
  return (process.env["OLLAMA_URL"] || "").replace(/\/$/, "");
}

// ── Health: check which backend is available ──────────────────
router.get("/ai/health", async (req, res) => {
  const ollamaBase = getOllamaUrl();

  if (ollamaBase) {
    try {
      const r = await fetch(`${ollamaBase}/api/tags`, {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = (await r.json()) as { models?: unknown[] };
        res.json({ status: "ok", backend: "ollama", models: data.models ?? [] });
        return;
      }
    } catch {
      // fall through to OpenAI
    }
  }

  // Check OpenAI proxy by verifying env vars are configured
  try {
    const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
    const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
    if (baseURL && apiKey) {
      res.json({ status: "ok", backend: "openai" });
    } else {
      res.status(503).json({ status: "unreachable", detail: "OpenAI integration not configured" });
    }
  } catch {
    res.status(503).json({ status: "unreachable" });
  }
});

// ── Generate: try Ollama first if configured, else use OpenAI ─
router.post("/ai/generate", async (req, res) => {
  const ollamaBase = getOllamaUrl();

  // ── Option A: forward to Ollama if OLLAMA_URL is set ─────────
  if (ollamaBase) {
    try {
      const upstream = await fetch(`${ollamaBase}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(120_000),
      });
      if (upstream.ok) {
        const data = await upstream.json();
        res.json(data);
        return;
      }
    } catch (err) {
      req.log.warn({ err }, "Ollama unavailable, falling back to OpenAI");
    }
  }

  // ── Option B: use Replit OpenAI integration ───────────────────
  try {
    const client = getOpenAIClient();
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";

    const completion = await client.chat.completions.create({
      model: "gpt-5.2",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational course designer. Always respond with valid JSON only — no markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 4096,
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    res.json({ response: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "AI generation failed");
    res.status(503).json({ error: "AI not reachable", detail: msg });
  }
});

export default router;
