export const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren't as at be because been before being below
between both but by can could did do does doing don't down during each few for from further had has have having
he her here hers herself him himself his how i if in into is isn't it it's its itself just let me more most my
myself no nor not now of off on once only or other ought our ours ourselves out over own same she should so some
such than that the their theirs them themselves then there these they this those through to too under until up
very was we were what when where which while who whom why will with would you your yours yourself yourselves
also get got may might must shall tell please give know want need use using used via per`
    .split(/\s+/)
    .filter(Boolean),
);

const WORD_RE = /[a-z0-9]+(?:['’][a-z]+)?/g;

/**
 * A deliberately small suffix-stripping stemmer (Porter-inspired). It is not
 * linguistically perfect, but it maps common inflections onto the same stem:
 * "limits" / "limited" / "limiting" -> "limit", "rotation" / "rotate" -> "rotat".
 */
export function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 3 || /^\d/.test(w)) return w;

  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("s") && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);

  let strippedVerb = false;
  if (w.endsWith("ing") && w.length - 3 >= 3) {
    w = w.slice(0, -3);
    strippedVerb = true;
  } else if (w.endsWith("ed") && !w.endsWith("eed") && w.length - 2 >= 3) {
    w = w.slice(0, -2);
    strippedVerb = true;
  }
  if (strippedVerb && /([^aeiouylsz])\1$/.test(w)) w = w.slice(0, -1);

  if (w.endsWith("ation") && w.length > 6) w = w.slice(0, -5) + "at";
  else if (w.endsWith("ly") && w.length > 5) w = w.slice(0, -2);

  if (w.endsWith("e") && w.length > 4) w = w.slice(0, -1);
  return w;
}

/** Lowercased words (before stopword removal and stemming). */
export function words(text: string): string[] {
  return text.toLowerCase().replace(/['’]s\b/g, "").match(WORD_RE) ?? [];
}

/** Tokenize for indexing/search: lowercase, drop stopwords, stem. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const w of words(text)) {
    if (STOPWORDS.has(w)) continue;
    if (w.length < 2 && !/\d/.test(w)) continue;
    out.push(stem(w));
  }
  return out;
}

export function uniqueTerms(text: string): string[] {
  return Array.from(new Set(tokenize(text)));
}
