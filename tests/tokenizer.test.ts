import { describe, expect, it } from "vitest";
import { stem, tokenize } from "@/lib/rag";

describe("tokenizer", () => {
  it("lowercases, removes stopwords and punctuation", () => {
    expect(tokenize("What is THE refund policy?")).toEqual(["refund", "policy"]);
  });

  it("keeps numbers such as HTTP status codes", () => {
    expect(tokenize("Handle a 429 error")).toEqual(["handl", "429", "error"]);
  });

  it("maps common inflections to the same stem", () => {
    expect(stem("limits")).toBe(stem("limit"));
    expect(stem("limited")).toBe(stem("limit"));
    expect(stem("billing")).toBe(stem("billed"));
    expect(stem("rotation")).toBe(stem("rotate"));
    expect(stem("rotating")).toBe(stem("rotate"));
    expect(stem("policies")).toBe(stem("policy"));
    expect(stem("exceeds")).toBe(stem("exceed"));
  });

  it("does not mangle short words or 'ss' endings", () => {
    expect(stem("api")).toBe("api");
    expect(stem("access")).toBe("access");
  });
});
