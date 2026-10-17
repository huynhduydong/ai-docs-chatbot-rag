import type { ScoredChunk } from "../rag/types";
import { buildCitations } from "./citations";
import { NOT_FOUND_TEXT, type LLMProvider, type ProviderAnswer } from "./types";

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  timeoutMs?: number;
}

export const SYSTEM_PROMPT = `You are DocuMind, a careful assistant that answers questions using ONLY the numbered context passages provided by the user.
Rules:
- Use only facts stated in the context. Never use outside knowledge and never guess.
- Cite every claim with the passage number in square brackets, e.g. [1] or [2][3], placed right after the claim.
- If the context does not contain the answer, reply exactly: "${NOT_FOUND_TEXT}"
- Be concise: 1-4 sentences or a short bullet list. Plain text or simple markdown (bold, bullet lists) only.`;

export function buildUserPrompt(question: string, contexts: ScoredChunk[]): string {
  const blocks = contexts
    .map((c, i) => `[${i + 1}] ${c.chunk.docTitle} › ${c.chunk.section}\n${c.chunk.text}`)
    .join("\n\n---\n\n");
  return `Context passages:\n\n${blocks}\n\nQuestion: ${question}`;
}

/**
 * Calls any OpenAI-compatible /chat/completions endpoint directly from the browser
 * (OpenAI, OpenRouter, Groq, Together, a local Ollama/LM Studio server, ...).
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly id = "openai-compatible";
  readonly name: string;

  constructor(private cfg: OpenAICompatibleConfig) {
    this.name = cfg.model || "OpenAI-compatible";
  }

  async answer(question: string, contexts: ScoredChunk[]): Promise<ProviderAnswer> {
    if (!contexts.length) return { text: NOT_FOUND_TEXT, citations: [], grounded: false };
    if (!this.cfg.apiKey) throw new Error("No API key configured. Open Settings to add one.");

    const url = `${this.cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? 60_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify({
          model: this.cfg.model,
          temperature: this.cfg.temperature ?? 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(question, contexts) },
          ],
        }),
      });
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const body = await res.json();
          detail = body?.error?.message ?? JSON.stringify(body);
        } catch {
          /* non-JSON error body */
        }
        throw new Error(`Provider returned ${res.status}: ${detail}`);
      }
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) throw new Error("Provider returned an empty response.");
      const { text, citations } = buildCitations(content, contexts);
      const grounded = !text.startsWith("I couldn't find that in the documents");
      return { text, citations, grounded };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw new Error("Request timed out.");
      if (err instanceof TypeError) {
        throw new Error(
          `Network error calling ${url}. Check the base URL and that the provider allows browser (CORS) requests.`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
