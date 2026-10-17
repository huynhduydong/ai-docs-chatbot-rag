import type { Chunk, SourceDocument } from "./types";

export interface ChunkOptions {
  /** Target maximum characters per chunk. */
  maxChars?: number;
  /** Characters of trailing context carried into the next chunk of the same section. */
  overlap?: number;
}

interface Block {
  section: string;
  text: string;
}

const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const LIST_RE = /^\s*(?:[-*+]|\d+[.)])\s+/;
const TABLE_RE = /^\s*\|.*\|\s*$/;
const TABLE_DIVIDER_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

/** Remove inline markdown so chunks read as plain text. */
export function stripInlineMarkdown(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^\w*])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1$2")
    .replace(/(^|[^\w_])_(?!\s)([^_]+?)_(?!\w)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => stripInlineMarkdown(c));
}

/** Turn a markdown table into one sentence per row, e.g. "Plan: Team — Burst: 100." */
function tableToSentences(lines: string[]): string {
  const rows = lines.filter((l) => !TABLE_DIVIDER_RE.test(l)).map(splitRow);
  if (rows.length < 2) return rows.map((r) => r.join(", ")).join("\n");
  const [header, ...body] = rows;
  return body
    .map((cells) => {
      const parts = cells.map((c, i) => (header[i] ? `${header[i]}: ${c}` : c));
      const [first, ...rest] = parts;
      return rest.length ? `${first} — ${rest.join("; ")}.` : `${first}.`;
    })
    .join("\n");
}

/** Parse markdown/plain text into section-tagged blocks (paragraphs, lists, tables, code). */
export function parseBlocks(text: string, docTitle: string): { title: string; blocks: Block[] } {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const headings: string[] = [];
  let title = docTitle;
  let sawH1 = false;
  const blocks: Block[] = [];
  let buf: string[] = [];
  let kind: "para" | "list" | "table" | "code" | null = null;

  const section = () => headings.filter(Boolean).join(" › ") || "Introduction";

  const flush = () => {
    if (!buf.length) return;
    let out = "";
    if (kind === "table") out = tableToSentences(buf);
    else if (kind === "list")
      out = buf
        .map((l) => (LIST_RE.test(l) ? "- " + stripInlineMarkdown(l.replace(LIST_RE, "")) : stripInlineMarkdown(l)))
        .join("\n");
    else if (kind === "code") out = buf.join("\n").trim();
    else out = stripInlineMarkdown(buf.join(" "));
    if (out) blocks.push({ section: section(), text: out });
    buf = [];
    kind = null;
  };

  let inFence = false;
  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");

    if (/^\s*(```|~~~)/.test(line)) {
      if (inFence) {
        flush();
        inFence = false;
      } else {
        flush();
        inFence = true;
        kind = "code";
      }
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }

    const h = HEADING_RE.exec(line);
    if (h) {
      flush();
      const level = h[1].length;
      const name = stripInlineMarkdown(h[2]);
      if (level === 1 && !sawH1) {
        sawH1 = true;
        title = name;
        headings.length = 0;
        continue;
      }
      const depth = Math.max(0, level - 2);
      headings.length = depth;
      headings[depth] = name;
      continue;
    }

    if (!line.trim()) {
      if (kind !== "list") flush();
      continue;
    }

    const content = line.replace(/^\s*>\s?/, "");
    const lineKind = TABLE_RE.test(content) ? "table" : LIST_RE.test(content) ? "list" : "para";
    if (kind === "list" && lineKind === "para" && /^\s{2,}/.test(content)) {
      buf[buf.length - 1] += " " + content.trim();
      continue;
    }
    if (kind && kind !== lineKind) flush();
    kind = lineKind;
    buf.push(content);
  }
  flush();
  return { title, blocks };
}

/**
 * Split text into sentence-like units. Newlines (list items, table rows) always split.
 * A unit starting with "…" is a partial sentence carried over as chunk overlap.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Only split on terminal punctuation followed by whitespace and an uppercase/digit start,
    // so decimals ("99.95%") and "e.g. foo" stay intact.
    for (const s of trimmed.replace(/([.!?]["')]?)\s+(?=[A-Z0-9"'(`])/g, "$1\u0000").split("\u0000")) {
      if (s.trim()) out.push(s.trim());
    }
  }
  return out;
}

function splitLong(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const pieces: string[] = [];
  let cur = "";
  for (const s of splitSentences(text)) {
    if (s.length > maxChars) {
      if (cur) pieces.push(cur);
      cur = "";
      for (let i = 0; i < s.length; i += maxChars) pieces.push(s.slice(i, i + maxChars));
      continue;
    }
    const joiner = text.includes("\n") ? "\n" : " ";
    if (cur && cur.length + s.length + 1 > maxChars) {
      pieces.push(cur);
      cur = s;
    } else cur = cur ? cur + joiner + s : s;
  }
  if (cur) pieces.push(cur);
  return pieces;
}

function tailOverlap(text: string, overlap: number): string {
  if (overlap <= 0) return "";
  const sentences = splitSentences(text);
  let tail = "";
  for (let i = sentences.length - 1; i >= 0; i--) {
    const next = tail ? sentences[i] + " " + tail : sentences[i];
    if (next.length > overlap) break;
    tail = next;
  }
  if (!tail && sentences.length) {
    const last = sentences[sentences.length - 1];
    if (last.length <= overlap * 2) return last;
    const cut = last.slice(-overlap);
    tail = "…" + cut.slice(cut.indexOf(" ") + 1);
  }
  return tail;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "doc"
  );
}

/** Derive a document title from the first H1, falling back to the file name. */
export function inferTitle(text: string, fileName: string): string {
  const h1 = /^#\s+(.+)$/m.exec(text);
  if (h1) return stripInlineMarkdown(h1[1]);
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Split a document into ~maxChars chunks. Chunks never cross section boundaries,
 * consecutive chunks of the same section share `overlap` characters of context,
 * and every chunk remembers its document title and section heading.
 */
export function chunkDocument(doc: SourceDocument, opts: ChunkOptions = {}): Chunk[] {
  const maxChars = opts.maxChars ?? 500;
  const overlap = Math.min(opts.overlap ?? 80, Math.floor(maxChars / 3));
  const { title, blocks } = parseBlocks(doc.text, doc.title);
  const docTitle = doc.title || title;

  const chunks: Chunk[] = [];
  let cur = "";
  let curSection = "";

  const push = () => {
    if (!cur.trim()) return;
    chunks.push({
      id: `${doc.id}#${chunks.length}`,
      docId: doc.id,
      docTitle,
      section: curSection,
      text: cur.trim(),
      index: chunks.length,
    });
  };

  for (const block of blocks) {
    if (block.section !== curSection) {
      push();
      cur = "";
      curSection = block.section;
    }
    for (const piece of splitLong(block.text, maxChars)) {
      const sep = cur ? "\n\n" : "";
      if (cur && cur.length + sep.length + piece.length > maxChars) {
        push();
        const tail = tailOverlap(cur, overlap);
        cur = tail ? tail + "\n\n" + piece : piece;
      } else {
        cur = cur + sep + piece;
      }
    }
  }
  push();
  return chunks;
}
