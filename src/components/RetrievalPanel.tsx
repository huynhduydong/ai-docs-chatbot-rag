"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import clsx from "clsx";
import type { RetrievalResult } from "@/lib/rag";
import Highlighted from "./Highlighted";

export default function RetrievalPanel({ retrieval, citedIds }: { retrieval: RetrievalResult; citedIds: Set<string> }) {
  const [open, setOpen] = useState(false);
  const { results, queryTerms, mode, tookMs, totalChunks } = retrieval;

  return (
    <div
      data-testid="retrieval-panel"
      className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-500 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Retrieval details</span>
        <span className="truncate">
          · top {results.length} of {totalChunks} chunks · {mode === "hybrid" ? "BM25 + TF-IDF" : "BM25"} · {tookMs.toFixed(1)} ms
        </span>
        <ChevronDown className={clsx("ml-auto h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="animate-fade-in space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-zinc-500">Query terms (stemmed):</span>
            {queryTerms.length ? (
              queryTerms.map((t) => (
                <code key={t} className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
                  {t}
                </code>
              ))
            ) : (
              <span className="text-zinc-400">none (only stopwords)</span>
            )}
          </div>

          {results.length === 0 ? (
            <p className="text-xs text-zinc-500">No chunk matched the query.</p>
          ) : (
            <ol className="space-y-2">
              {results.map((r, i) => (
                <li key={r.chunk.id} className="rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-zinc-100 font-mono text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                      {r.chunk.docTitle} <span className="text-zinc-400">›</span> {r.chunk.section}
                    </span>
                    {citedIds.has(r.chunk.id) && (
                      <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        cited
                      </span>
                    )}
                    <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-zinc-700 dark:text-zinc-300">
                      {r.score.toFixed(3)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${Math.max(2, r.score * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10.5px] tabular-nums text-zinc-500">
                    <span>bm25 {r.bm25.toFixed(2)}</span>
                    {mode === "hybrid" && <span>cosine {r.cosine.toFixed(3)}</span>}
                    <span>coverage {Math.round(r.coverage * 100)}%</span>
                    <span>chunk #{r.chunk.index}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <Highlighted text={r.chunk.text} terms={queryTerms} />
                  </p>
                </li>
              ))}
            </ol>
          )}

          <p className="font-mono text-[10.5px] text-zinc-400">
            {mode === "hybrid"
              ? "score = 0.65 · (1 − e^(−bm25/6)) + 0.35 · cosine(hashed TF-IDF)"
              : "score = 1 − e^(−bm25/6)"}
          </p>
        </div>
      )}
    </div>
  );
}
