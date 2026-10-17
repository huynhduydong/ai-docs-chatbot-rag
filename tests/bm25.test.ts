import { describe, expect, it } from "vitest";
import { BM25Index, HybridRetriever, highlightSegments, type Chunk } from "@/lib/rag";
import { loadSampleChunks } from "./helpers";

const mk = (id: string, text: string, section = "S", docId = "doc"): Chunk => ({
  id,
  docId,
  docTitle: "Doc",
  section,
  text,
  index: 0,
});

describe("BM25Index", () => {
  const corpus = [
    mk("a", "Refunds are issued within 14 days for annual plans."),
    mk("b", "Rate limits are enforced per API key. Exceeding the rate limit returns 429."),
    mk("c", "Webhooks are signed with HMAC-SHA256."),
  ];

  it("ranks the chunk that contains the query terms first", () => {
    const idx = new BM25Index();
    idx.add(corpus);
    const hits = idx.search("what is the rate limit?", 3);
    expect(hits[0].chunk.id).toBe("b");
    expect(hits[0].matchedTerms).toEqual(expect.arrayContaining(["rate", "limit"]));
    expect(hits.every((h) => h.score > 0)).toBe(true);
  });

  it("returns nothing for queries with no known terms", () => {
    const idx = new BM25Index();
    idx.add(corpus);
    expect(idx.search("pizza margherita")).toEqual([]);
    expect(idx.search("the of and")).toEqual([]);
  });

  it("gives rarer terms a higher IDF", () => {
    const idx = new BM25Index();
    idx.add([...corpus, mk("d", "Annual billing gives a discount.")]);
    expect(idx.idf("webhook")).toBeGreaterThan(idx.idf("annual"));
  });

  it("supports removing documents", () => {
    const idx = new BM25Index();
    idx.add([mk("x1", "alpha beta", "S", "x"), mk("y1", "alpha gamma", "S", "y")]);
    idx.removeDocument("x");
    expect(idx.size).toBe(1);
    expect(idx.search("beta")).toEqual([]);
    expect(idx.search("alpha")[0].chunk.id).toBe("y1");
  });

  it("also indexes the section heading", () => {
    const idx = new BM25Index();
    idx.add([mk("s", "Keys must be rotated every 90 days.", "Authentication › Key rotation")]);
    expect(idx.search("authentication")[0]?.chunk.id).toBe("s");
  });
});

describe("HybridRetriever on the sample docs", () => {
  const retriever = new HybridRetriever(loadSampleChunks());

  it.each([
    ["How do I verify webhook signatures?", "Webhooks › Verifying signatures"],
    ["Can I get a refund on an annual plan?", "Refunds and credits"],
    ["How long are automatic backups kept?", "Data retention › Backups"],
  ])("%s -> %s", (q, section) => {
    const { results } = retriever.retrieve(q, { topK: 3 });
    expect(results.map((r) => r.chunk.section)).toContain(section);
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  it("returns top-k sorted by score with scores in [0, 1]", () => {
    const { results } = retriever.retrieve("API rate limits 429", { topK: 4 });
    expect(results).toHaveLength(4);
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });

  it("works in pure BM25 mode", () => {
    const res = retriever.retrieve("refund annual plan", { topK: 2, hybrid: false });
    expect(res.mode).toBe("bm25");
    expect(res.results[0].chunk.section).toBe("Refunds and credits");
  });
});

describe("highlightSegments", () => {
  it("highlights words whose stem matches a query term", () => {
    const segs = highlightSegments("Rotating keys regularly.", ["rotat", "key"]);
    expect(segs.filter((s) => s.match).map((s) => s.text)).toEqual(["Rotating", "keys"]);
    expect(segs.map((s) => s.text).join("")).toBe("Rotating keys regularly.");
  });
});
