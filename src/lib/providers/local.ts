import { splitSentences } from "../rag/chunker";
import { tokenize } from "../rag/tokenizer";
import type { ScoredChunk } from "../rag/types";
import { buildCitations } from "./citations";
import { NOT_FOUND_TEXT, type LLMProvider, type ProviderAnswer } from "./types";

export interface LocalProviderOptions {
  /** Minimum retrieval score of the best chunk to attempt an answer. */
  minScore?: number;
  /** Minimum fraction of query terms the best chunk must contain. */
  minCoverage?: number;
  maxSentences?: number;
  /** How many of the top chunks to mine for sentences. */
  maxContexts?: number;
}

interface Candidate {
  ctx: number;
  pos: number;
  /** Sentence text; for a list item, the item text; for a group, the lead-in line. */
  text: string;
  kind: "sentence" | "item" | "group";
  /** List items that follow a lead-in ending with ":" (groups only). */
  items: string[];
  /** Positions covered by this candidate, used to avoid repeating grouped items. */
  covers: number[];
  terms: Set<string>;
  score: number;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

function finish(s: string): string {
  return /[.!?:]$/.test(s) ? s : s + ".";
}

const ITEM_RE = /^[-*]\s+/;

/**
 * Extractive "LLM": no network, no key. Picks the sentences from the top chunks
 * that best cover the question terms and stitches them into a short answer with
 * citation markers. Refuses honestly when retrieval confidence is low.
 */
export class LocalProvider implements LLMProvider {
  readonly id = "local";
  readonly name = "Local · extractive";
  private opts: Required<LocalProviderOptions>;

  constructor(opts: LocalProviderOptions = {}) {
    this.opts = { minScore: 0.2, minCoverage: 0.34, maxSentences: 4, maxContexts: 4, ...opts };
  }

  async answer(question: string, contexts: ScoredChunk[]): Promise<ProviderAnswer> {
    return this.answerSync(question, contexts);
  }

  answerSync(question: string, contexts: ScoredChunk[]): ProviderAnswer {
    const notFound: ProviderAnswer = { text: NOT_FOUND_TEXT, citations: [], grounded: false };
    const best = contexts[0];
    if (!best || best.bm25 <= 0 || best.score < this.opts.minScore || best.coverage < this.opts.minCoverage) {
      return notFound;
    }

    const qTerms = Array.from(new Set(tokenize(question)));
    // Rarer query terms (appearing in fewer retrieved chunks) are more informative.
    const weight = new Map<string, number>();
    for (const t of qTerms) {
      const df = contexts.filter((c) => c.matchedTerms.includes(t)).length;
      weight.set(t, 1 + Math.log(1 + contexts.length / (1 + df)));
    }
    const totalWeight = qTerms.reduce((s, t) => s + (weight.get(t) ?? 1), 0) || 1;
    const minTermScore = Math.min(0.4, 1.2 / Math.max(1, qTerms.length));
    const termScore = (terms: Set<string>) =>
      qTerms.reduce((s, t) => s + (terms.has(t) ? (weight.get(t) ?? 1) : 0), 0) / totalWeight;

    const candidates: Candidate[] = [];
    contexts.slice(0, this.opts.maxContexts).forEach((c, ctx) => {
      if (c.score < best.score * 0.45) return;
      const sectionTerms = new Set(tokenize(c.chunk.section));
      const sectionBonus = qTerms.some((t) => sectionTerms.has(t)) ? 0.15 : 0;
      const units = splitSentences(c.chunk.text);

      const add = (cand: Omit<Candidate, "score" | "terms">, extraPenalty = 0) => {
        const terms = new Set(tokenize([cand.text, ...cand.items].join(" ")));
        const ts = termScore(terms);
        if (ts < minTermScore) return;
        const length = cand.text.length + cand.items.join(" ").length;
        const lengthPenalty = length > (cand.kind === "group" ? 700 : 320) ? 0.15 : 0;
        const score = ts + 0.5 * c.score + sectionBonus - lengthPenalty - extraPenalty - ctx * 0.03;
        candidates.push({ ...cand, terms, score });
      };

      units.forEach((raw, pos) => {
        if (raw.startsWith("…")) return;
        const isItem = ITEM_RE.test(raw);
        const text = raw.replace(ITEM_RE, "").trim();
        if (text.length < 12 || /^[{[<]/.test(text)) return;

        if (!isItem && text.endsWith(":")) {
          const items: string[] = [];
          const covers = [pos];
          for (let j = pos + 1; j < units.length && ITEM_RE.test(units[j]); j++) {
            items.push(units[j].replace(ITEM_RE, "").trim());
            covers.push(j);
          }
          if (items.length) add({ ctx, pos, text, kind: "group", items, covers });
          return;
        }
        add({ ctx, pos, text, kind: isItem ? "item" : "sentence", items: [], covers: [pos] });
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    const top = candidates[0];
    if (!top) return notFound;

    const picked: Candidate[] = [];
    const used = new Set<string>();
    let budget = this.opts.maxSentences;
    for (const cand of candidates) {
      if (budget <= 0) break;
      if (cand.score < top.score * 0.6) break;
      if (cand.covers.some((p) => used.has(`${cand.ctx}:${p}`))) continue;
      if (picked.some((p) => p.text === cand.text || jaccard(p.terms, cand.terms) > 0.6)) continue;
      picked.push(cand);
      cand.covers.forEach((p) => used.add(`${cand.ctx}:${p}`));
      budget -= cand.kind === "group" ? 2 : 1;
    }
    picked.sort((a, b) => a.ctx - b.ctx || a.pos - b.pos);

    const parts: string[] = [];
    let prose: string[] = [];
    let bullets: string[] = [];
    const flushProse = () => {
      if (prose.length) parts.push(prose.join(" "));
      prose = [];
    };
    const flushBullets = () => {
      if (bullets.length) parts.push(bullets.join("\n"));
      bullets = [];
    };
    for (const p of picked) {
      const cite = `[${p.ctx + 1}]`;
      if (p.kind === "sentence") {
        flushBullets();
        prose.push(`${finish(p.text)} ${cite}`);
      } else if (p.kind === "item") {
        flushProse();
        bullets.push(`- ${finish(p.text)} ${cite}`);
      } else {
        flushBullets();
        prose.push(`${p.text} ${cite}`);
        flushProse();
        parts.push(p.items.map((i) => `- ${finish(i)}`).join("\n"));
      }
    }
    flushProse();
    flushBullets();

    const { text, citations } = buildCitations(parts.join("\n\n"), contexts);
    return { text, citations, grounded: true };
  }
}
