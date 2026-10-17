import { tokenize, words } from "./tokenizer";

export const EMBEDDING_DIM = 1024;

/** 32-bit FNV-1a hash. */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type IdfFn = (term: string) => number;

/**
 * A lightweight "embedding": stemmed unigrams weighted by TF-IDF plus character
 * trigrams (for fuzzy/morphological matches), hashed into a fixed-size signed
 * vector and L2-normalised. No model download, deterministic, ~microseconds.
 */
export function embed(text: string, idf: IdfFn = () => 1, dim = EMBEDDING_DIM): Float32Array {
  const v = new Float32Array(dim);
  const add = (feature: string, weight: number) => {
    const h = fnv1a(feature);
    const sign = h & 0x80000000 ? -1 : 1;
    v[h % dim] += sign * weight;
  };

  const tf = new Map<string, number>();
  for (const t of tokenize(text)) tf.set(t, (tf.get(t) ?? 0) + 1);
  for (const [term, f] of tf) add("w:" + term, (1 + Math.log(f)) * idf(term));

  const grams = new Map<string, number>();
  for (const w of words(text)) {
    if (w.length < 4) continue;
    const padded = `^${w}$`;
    for (let i = 0; i + 3 <= padded.length; i++) {
      const g = padded.slice(i, i + 3);
      grams.set(g, (grams.get(g) ?? 0) + 1);
    }
  }
  for (const [g, f] of grams) add("c:" + g, 0.35 * (1 + Math.log(f)));

  let norm = 0;
  for (let i = 0; i < dim; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
