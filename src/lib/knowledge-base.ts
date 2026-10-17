import { chunkDocument, inferTitle, slugify, type Chunk } from "./rag";

export interface DocRecord {
  id: string;
  title: string;
  fileName: string;
  source: "sample" | "upload";
  size: number;
  chunks: Chunk[];
  url?: string;
}

export const SAMPLE_FILES = [
  "nimbus-pricing-billing-faq.md",
  "nimbus-api-reference.md",
  "nimbus-security-data-retention.md",
];

export const ACCEPTED_EXTENSIONS = [".md", ".markdown", ".txt"];
export const MAX_FILE_BYTES = 1.5 * 1024 * 1024;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function buildDoc(text: string, fileName: string, source: DocRecord["source"], url?: string): DocRecord {
  const id = `${source}-${slugify(fileName)}`;
  const title = inferTitle(text, fileName);
  return {
    id,
    title,
    fileName,
    source,
    size: new Blob([text]).size,
    chunks: chunkDocument({ id, title, fileName, text }),
    url,
  };
}

export async function loadSampleDocs(): Promise<DocRecord[]> {
  return Promise.all(
    SAMPLE_FILES.map(async (file) => {
      const url = `${basePath}/docs/${file}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${file} (${res.status})`);
      return buildDoc(await res.text(), file, "sample", url);
    }),
  );
}

export async function ingestFile(file: File): Promise<DocRecord> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) throw new Error(`${file.name}: only .md and .txt files are supported`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: file is larger than 1.5 MB`);
  const text = await file.text();
  if (!text.trim()) throw new Error(`${file.name}: file is empty`);
  const doc = buildDoc(text, file.name, "upload");
  if (!doc.chunks.length) throw new Error(`${file.name}: no readable text found`);
  return doc;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
