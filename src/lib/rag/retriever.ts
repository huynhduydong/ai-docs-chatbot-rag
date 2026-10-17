import { BM25Index } from "./bm25";
import { cosine, embed } from "./embedding";
import { tokenize } from "./tokenizer";
import type { Chunk, RetrievalOptions, RetrievalResult, ScoredChunk } from "./types";

/** Maps an unbounded BM25 score onto [0, 1) so it can be blended and thresholded. */
export function saturate(bm25: number, scale = 6): number {
  return 1 - Math.exp(-bm25 / scale);
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/**
 * BM25 retrieval with an optional hybrid re-score using hashed TF-IDF cosine
 * similarity. Final score = alpha * saturate(bm25) + (1 - alpha) * cosine.
 */
export class HybridRetriever {
  readonly bm25 = new BM25Index();
  private vectors = new Map<string, Float32Array>();
  private dirty = true;

  constructor(chunks: Chunk[] = []) {
    this.add(chunks);
  }

  get size(): number {
    return this.bm25.size;
  }

  add(chunks: Chunk[]): void {
    this.bm25.add(chunks);
    this.dirty = true;
  }

  removeDocument(docId: string): void {
    this.bm25.removeDocument(docId);
    this.dirty = true;
  }

  /** IDF changes whenever the corpus changes, so vectors are rebuilt lazily. */
  private ensureVectors(): void {
    if (!this.dirty) return;
    this.vectors.clear();
    const idf = (t: string) => this.bm25.idf(t);
    for (const c of this.bm25.chunks()) this.vectors.set(c.id, embed(BM25Index.indexText(c), idf));
    this.dirty = false;
  }

  retrieve(query: string, opts: RetrievalOptions = {}): RetrievalResult {
    const t0 = now();
    const topK = opts.topK ?? 5;
    const hybrid = opts.hybrid ?? true;
    const alpha = opts.alpha ?? 0.65;
    const queryTerms = Array.from(new Set(tokenize(query)));
    const base = { query, queryTerms, totalChunks: this.size, mode: hybrid ? "hybrid" : "bm25" } as const;

    if (!queryTerms.length || !this.size) {
      return { ...base, results: [], tookMs: now() - t0 };
    }

    let results: ScoredChunk[];
    if (!hybrid) {
      results = this.bm25.search(query, topK).map((h) => ({
        chunk: h.chunk,
        bm25: h.score,
        cosine: 0,
        score: saturate(h.score),
        matchedTerms: h.matchedTerms,
        coverage: h.matchedTerms.length / queryTerms.length,
      }));
    } else {
      this.ensureVectors();
      const qv = embed(query, (t) => this.bm25.idf(t));
      results = [];
      for (const chunk of this.bm25.chunks()) {
        const hit = this.bm25.scoreChunk(chunk.id, queryTerms)!;
        const cos = Math.max(0, cosine(qv, this.vectors.get(chunk.id)!));
        const score = alpha * saturate(hit.score) + (1 - alpha) * cos;
        if (score <= 0.02) continue;
        results.push({
          chunk,
          bm25: hit.score,
          cosine: cos,
          score,
          matchedTerms: hit.matchedTerms,
          coverage: hit.matchedTerms.length / queryTerms.length,
        });
      }
      results.sort((a, b) => b.score - a.score);
      results = results.slice(0, topK);
    }
    return { ...base, results, tookMs: now() - t0 };
  }
}
