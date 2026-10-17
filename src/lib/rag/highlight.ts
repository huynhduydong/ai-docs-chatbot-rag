import { STOPWORDS, stem } from "./tokenizer";

export interface Segment {
  text: string;
  match: boolean;
}

/** Split text into segments, flagging words whose stem is one of `terms`. */
export function highlightSegments(text: string, terms: Iterable<string>): Segment[] {
  const set = new Set(terms);
  if (!set.size) return [{ text, match: false }];
  const segments: Segment[] = [];
  const re = /[A-Za-z0-9]+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (t: string, match: boolean) => {
    if (!t) return;
    const prev = segments[segments.length - 1];
    if (prev && prev.match === match) prev.text += t;
    else segments.push({ text: t, match });
  };
  while ((m = re.exec(text))) {
    const word = m[0].toLowerCase();
    const isMatch = !STOPWORDS.has(word) && set.has(stem(word));
    push(text.slice(last, m.index), false);
    push(m[0], isMatch);
    last = m.index + m[0].length;
  }
  push(text.slice(last), false);
  return segments;
}
