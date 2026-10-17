export interface SourceDocument {
  id: string;
  title: string;
  fileName: string;
  text: string;
}

export interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  section: string;
  text: string;
  /** Position of the chunk inside its document (0-based). */
  index: number;
}

export interface ScoredChunk {
  chunk: Chunk;
  /** Final ranking score in [0, 1]. */
  score: number;
  /** Raw BM25 score (unbounded). */
  bm25: number;
  /** Cosine similarity of hashed TF-IDF vectors in [0, 1]. */
  cosine: number;
  /** Query stems that appear in the chunk. */
  matchedTerms: string[];
  /** Fraction of the query's stems that appear in the chunk. */
  coverage: number;
}

export interface RetrievalOptions {
  topK?: number;
  /** When true, BM25 is blended with the hashed TF-IDF cosine score. */
  hybrid?: boolean;
  /** Weight of BM25 in the hybrid blend (0..1). */
  alpha?: number;
}

export interface RetrievalResult {
  query: string;
  queryTerms: string[];
  results: ScoredChunk[];
  tookMs: number;
  totalChunks: number;
  mode: "bm25" | "hybrid";
}
