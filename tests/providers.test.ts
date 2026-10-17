import { afterEach, describe, expect, it, vi } from "vitest";
import { HybridRetriever } from "@/lib/rag";
import { buildCitations, LocalProvider, NOT_FOUND_TEXT, OpenAICompatibleProvider } from "@/lib/providers";
import { loadSampleChunks } from "./helpers";

const retriever = new HybridRetriever(loadSampleChunks());
const local = new LocalProvider();
const ask = (q: string) => local.answer(q, retriever.retrieve(q, { topK: 5 }).results);

describe("LocalProvider", () => {
  it("answers from the documents with inline citations", async () => {
    const a = await ask("Can I get a refund on an annual plan?");
    expect(a.grounded).toBe(true);
    expect(a.text).toMatch(/14 days/);
    expect(a.text).toMatch(/\[1\]/);
    expect(a.citations[0]).toMatchObject({ n: 1, section: "Refunds and credits" });
  });

  it("numbers citations sequentially and only lists cited sources", async () => {
    const a = await ask("What are the API rate limits and how should I handle a 429?");
    const markers = Array.from(new Set(a.text.match(/\[(\d+)\]/g)));
    expect(markers).toEqual(a.citations.map((c) => `[${c.n}]`));
    expect(a.citations.map((c) => c.n)).toEqual(a.citations.map((_, i) => i + 1));
  });

  it("admits when the answer is not in the documents", async () => {
    for (const q of ["What is the capital of France?", "Who won the football world cup?"]) {
      const a = await ask(q);
      expect(a.grounded).toBe(false);
      expect(a.text).toBe(NOT_FOUND_TEXT);
      expect(a.citations).toEqual([]);
    }
  });
});

describe("buildCitations", () => {
  it("renumbers by first appearance and drops unknown markers", () => {
    const ctx = retriever.retrieve("refund annual plan webhook", { topK: 3 }).results;
    const { text, citations } = buildCitations("A [3]. B [1, 3]. C [9].", ctx);
    expect(text).toBe("A [1]. B [2][1]. C.");
    expect(citations.map((c) => c.chunkId)).toEqual([ctx[2].chunk.id, ctx[0].chunk.id]);
  });
});

describe("OpenAICompatibleProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends numbered context to /chat/completions and maps citations", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "Refunds within 14 days [2]." } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const ctx = retriever.retrieve("refund annual plan", { topK: 3 }).results;
    const p = new OpenAICompatibleProvider({ apiKey: "sk-test", baseUrl: "https://example.com/v1/", model: "m" });
    const a = await p.answer("refund?", ctx);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://example.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(init.body as string);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].content).toContain("[1] ");
    expect(a.text).toBe("Refunds within 14 days [1].");
    expect(a.citations[0].chunkId).toBe(ctx[1].chunk.id);
  });
});
