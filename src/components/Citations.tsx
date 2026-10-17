import { ChevronRight, FileText, X } from "lucide-react";
import clsx from "clsx";
import type { Citation } from "@/lib/providers";
import Highlighted from "./Highlighted";

interface Props {
  citations: Citation[];
  queryTerms: string[];
  open: number | null;
  onToggle: (n: number | null) => void;
}

export default function Citations({ citations, queryTerms, open, onToggle }: Props) {
  const active = citations.find((c) => c.n === open);
  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => (
          <button
            key={c.n}
            type="button"
            data-testid="citation-chip"
            aria-expanded={open === c.n}
            onClick={() => onToggle(open === c.n ? null : c.n)}
            title={`${c.docTitle} › ${c.section}`}
            className={clsx(
              "group inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs transition",
              open === c.n
                ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-100"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700",
            )}
          >
            <span
              className={clsx(
                "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
                open === c.n
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
              )}
            >
              {c.n}
            </span>
            <span className="max-w-[11rem] truncate font-medium">{c.docTitle}</span>
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
            <span className="max-w-[12rem] truncate text-zinc-500 dark:text-zinc-400">{c.section}</span>
          </button>
        ))}
      </div>

      {active && (
        <div
          data-testid="citation-snippet"
          className="animate-fade-in mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800">
            <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">{active.docTitle}</span>
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
            <span className="truncate text-zinc-500">{active.section}</span>
            <span className="ml-auto shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
              score {active.score.toFixed(3)}
            </span>
            <button
              type="button"
              onClick={() => onToggle(null)}
              aria-label="Close source"
              className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="max-h-64 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 text-[13px] leading-relaxed text-zinc-700 scroll-thin dark:text-zinc-300">
            <Highlighted text={active.snippet} terms={queryTerms} />
          </p>
        </div>
      )}
    </div>
  );
}
