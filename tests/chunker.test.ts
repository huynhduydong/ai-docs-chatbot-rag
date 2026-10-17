import { describe, expect, it } from "vitest";
import { chunkDocument, inferTitle, splitSentences } from "@/lib/rag";
import { loadSampleChunks } from "./helpers";

const doc = (text: string) => ({ id: "d", fileName: "d.md", title: inferTitle(text, "d.md"), text });

describe("chunker", () => {
  it("takes the title from the H1 and tags chunks with the section path", () => {
    const chunks = chunkDocument(
      doc("# Handbook\n\nIntro text here.\n\n## Billing\n\nWe bill monthly.\n\n### Refunds\n\nRefunds take 5 days."),
    );
    expect(chunks.map((c) => c.docTitle)).toEqual(["Handbook", "Handbook", "Handbook"]);
    expect(chunks.map((c) => c.section)).toEqual(["Introduction", "Billing", "Billing › Refunds"]);
    expect(chunks[2].text).toBe("Refunds take 5 days.");
  });

  it("falls back to the file name for documents without a heading", () => {
    expect(inferTitle("just text", "release-notes_v2.txt")).toBe("Release Notes V2");
  });

  it("keeps chunks near the size budget and overlaps consecutive chunks", () => {
    const sentence = (i: number) => `Sentence number ${i} talks about storage quotas and limits.`;
    const body = Array.from({ length: 40 }, (_, i) => sentence(i)).join(" ");
    const chunks = chunkDocument(doc(`# T\n\n## S\n\n${body}`), { maxChars: 300, overlap: 80 });
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect(c.text.length).toBeLessThanOrEqual(300 + 160);
    for (let i = 1; i < chunks.length; i++) {
      const prevLast = splitSentences(chunks[i - 1].text).at(-1)!;
      expect(chunks[i].text.startsWith(prevLast)).toBe(true);
    }
  });

  it("never mixes two sections in one chunk", () => {
    const chunks = chunkDocument(doc("# T\n\n## A\n\nAlpha.\n\n## B\n\nBeta."), { maxChars: 500 });
    expect(chunks.map((c) => c.text)).toEqual(["Alpha.", "Beta."]);
  });

  it("strips inline markdown and converts tables into row sentences", () => {
    const chunks = chunkDocument(
      doc("# T\n\n## Limits\n\n**Bold** and `code`.\n\n| Plan | Rate |\n|---|---|\n| Team | 600/min |"),
    );
    expect(chunks[0].text).toContain("Bold and code.");
    expect(chunks[0].text).toContain("Plan: Team — Rate: 600/min.");
  });

  it("splits sentences without breaking decimals", () => {
    expect(splitSentences("Uptime is 99.95% here. Next one!\n- item")).toEqual([
      "Uptime is 99.95% here.",
      "Next one!",
      "- item",
    ]);
  });

  it("chunks the sample knowledge base into ~500 char chunks", () => {
    const chunks = loadSampleChunks();
    expect(chunks.length).toBeGreaterThan(30);
    expect(new Set(chunks.map((c) => c.docId)).size).toBe(3);
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(700);
      expect(c.section.length).toBeGreaterThan(0);
    }
  });
});
