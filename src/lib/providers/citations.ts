import type { ScoredChunk } from "../rag/types";
import type { Citation } from "./types";

const MARKER_RE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/**
 * Rewrites context-numbered markers ("[3]", "[1, 4]") into sequential citation
 * numbers in order of first appearance, drops markers that point at no context,
 * and returns the matching citation list.
 */
export function buildCitations(text: string, contexts: ScoredChunk[]): { text: string; citations: Citation[] } {
  const mapping = new Map<number, number>();
  const citations: Citation[] = [];

  const rewritten = text.replace(MARKER_RE, (_, group: string) => {
    const nums: number[] = [];
    for (const raw of group.split(",")) {
      const ctxIndex = parseInt(raw.trim(), 10) - 1;
      const ctx = contexts[ctxIndex];
      if (!ctx) continue;
      let n = mapping.get(ctxIndex);
      if (n === undefined) {
        n = citations.length + 1;
        mapping.set(ctxIndex, n);
        citations.push({
          n,
          chunkId: ctx.chunk.id,
          docId: ctx.chunk.docId,
          docTitle: ctx.chunk.docTitle,
          section: ctx.chunk.section,
          snippet: ctx.chunk.text,
          score: ctx.score,
          matchedTerms: ctx.matchedTerms,
        });
      }
      if (!nums.includes(n)) nums.push(n);
    }
    return nums.map((n) => `[${n}]`).join("");
  });

  return { text: rewritten.replace(/[ \t]+([.,;:])/g, "$1").trim(), citations };
}
