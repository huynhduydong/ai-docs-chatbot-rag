import type { ScoredChunk } from "../rag/types";

export interface Citation {
  /** Number shown in the answer text, e.g. 1 for "[1]". */
  n: number;
  chunkId: string;
  docId: string;
  docTitle: string;
  section: string;
  snippet: string;
  score: number;
  matchedTerms: string[];
}

export interface ProviderAnswer {
  text: string;
  citations: Citation[];
  /** False when the provider decided the documents don't contain the answer. */
  grounded: boolean;
}

export interface LLMProvider {
  id: string;
  name: string;
  answer(question: string, contexts: ScoredChunk[]): Promise<ProviderAnswer>;
}

export const NOT_FOUND_TEXT =
  "I couldn't find that in the documents. Try rephrasing the question, or upload a document that covers this topic.";
