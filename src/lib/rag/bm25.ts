import { tokenize } from "./tokenizer";
import type { Chunk } from "./types";

export interface BM25Params {
  k1?: number;
  b?: number;
}

export interface BM25Hit {
  chunk: Chunk;
  score: number;
  matchedTerms: string[];
}

interface Entry {
  chunk: Chunk;
  tf: Map<string, number>;
  length: number;
}

/**
 * Okapi BM25 over an in-memory inverted index. Supports incremental add/remove,
 * which is what the UI needs when users upload or delete documents.
 */
export class BM25Index {
  readonly k1: number;
  readonly b: number;
  private entries = new Map<string, Entry>();
  private postings = new Map<string, Set<string>>();
  private totalLength = 0;

  constructor(params: BM25Params = {}) {
    this.k1 = params.k1 ?? 1.5;
    this.b = params.b ?? 0.75;
  }

  get size(): number {
    return this.entries.size;
  }

  get avgLength(): number {
    return this.entries.size ? this.totalLength / this.entries.size : 0;
  }

  /** Index text includes the section heading so "rate limits" matches chunks under that heading. */
  static indexText(chunk: Chunk): string {
    return `${chunk.section}\n${chunk.text}`;
  }

  add(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      if (this.entries.has(chunk.id)) this.removeChunk(chunk.id);
      const tokens = tokenize(BM25Index.indexText(chunk));
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      this.entries.set(chunk.id, { chunk, tf, length: tokens.length });
      this.totalLength += tokens.length;
      for (const term of tf.keys()) {
        let set = this.postings.get(term);
        if (!set) this.postings.set(term, (set = new Set()));
        set.add(chunk.id);
      }
    }
  }

  removeChunk(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    for (const term of entry.tf.keys()) {
      const set = this.postings.get(term);
      set?.delete(id);
      if (set && set.size === 0) this.postings.delete(term);
    }
    this.totalLength -= entry.length;
    this.entries.delete(id);
  }

  removeDocument(docId: string): void {
    for (const [id, e] of Array.from(this.entries)) if (e.chunk.docId === docId) this.removeChunk(id);
  }

  docFreq(term: string): number {
    return this.postings.get(term)?.size ?? 0;
  }

  /** BM25 IDF with +1 inside the log so it never goes negative for very common terms. */
  idf(term: string): number {
    const n = this.entries.size;
    const df = this.docFreq(term);
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  chunks(): Chunk[] {
    return Array.from(this.entries.values(), (e) => e.chunk);
  }

  scoreChunk(id: string, terms: string[]): BM25Hit | null {
    const e = this.entries.get(id);
    if (!e) return null;
    const avg = this.avgLength || 1;
    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const f = e.tf.get(term);
      if (!f) continue;
      matched.push(term);
      const norm = f * (this.k1 + 1);
      const denom = f + this.k1 * (1 - this.b + (this.b * e.length) / avg);
      score += this.idf(term) * (norm / denom);
    }
    return { chunk: e.chunk, score, matchedTerms: matched };
  }

  search(query: string, k = 5): BM25Hit[] {
    const terms = Array.from(new Set(tokenize(query)));
    if (!terms.length) return [];
    const candidates = new Set<string>();
    for (const t of terms) this.postings.get(t)?.forEach((id) => candidates.add(id));
    const hits: BM25Hit[] = [];
    for (const id of candidates) {
      const hit = this.scoreChunk(id, terms);
      if (hit && hit.score > 0) hits.push(hit);
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, k);
  }
}
