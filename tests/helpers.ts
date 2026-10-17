import fs from "node:fs";
import path from "node:path";
import { chunkDocument, inferTitle, type Chunk } from "@/lib/rag";

export const DOCS_DIR = path.resolve(__dirname, "../public/docs");

export function loadSampleChunks(): Chunk[] {
  return fs.readdirSync(DOCS_DIR).flatMap((fileName) => {
    const text = fs.readFileSync(path.join(DOCS_DIR, fileName), "utf8");
    return chunkDocument({ id: fileName, fileName, title: inferTitle(text, fileName), text });
  });
}
