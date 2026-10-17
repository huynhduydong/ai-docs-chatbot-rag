"use client";

import { useRef, useState, type DragEvent } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, FileText, FileUp, Loader2, RotateCcw, X } from "lucide-react";
import clsx from "clsx";
import { ACCEPTED_EXTENSIONS, formatBytes, type DocRecord } from "@/lib/knowledge-base";

export interface UploadStatus {
  kind: "ok" | "error";
  text: string;
}

interface Props {
  docs: DocRecord[];
  loading: boolean;
  status: UploadStatus | null;
  canRestore: boolean;
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRestore: () => void;
  onClose?: () => void;
}

export default function Sidebar({ docs, loading, status, canRestore, onFiles, onRemove, onRestore, onClose }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chunkCount = docs.reduce((s, d) => s + d.chunks.length, 0);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Knowledge base</h2>
          <p className="mt-0.5 text-xs text-zinc-400" data-testid="kb-stats">
            {docs.length} {docs.length === 1 ? "document" : "documents"} · {chunkCount} chunks
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close documents"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={clsx(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-4 text-center transition",
            dragging
              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
              : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500/60",
          )}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <FileUp className="h-[18px] w-[18px]" />
          </span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Drop files or <span className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">browse</span>
          </span>
          <span className="text-[11px] text-zinc-400">.md or .txt · indexed locally, never uploaded</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={[...ACCEPTED_EXTENSIONS, "text/markdown", "text/plain"].join(",")}
            data-testid="upload-input"
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onFiles(files);
              e.target.value = "";
            }}
          />
        </label>

        {status && (
          <p
            role="status"
            className={clsx(
              "animate-fade-in mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs",
              status.kind === "ok"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
            )}
          >
            {status.kind === "ok" ? (
              <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
            )}
            <span className="break-words">{status.text}</span>
          </p>
        )}
      </div>

      <div className="scroll-thin mt-3 flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Indexing sample documents…
          </div>
        ) : docs.length === 0 ? (
          <p className="px-2 py-3 text-sm text-zinc-500">No documents yet. Upload a file to start asking questions.</p>
        ) : (
          <ul className="space-y-1">
            {docs.map((d) => (
              <li
                key={d.id}
                data-testid="doc-item"
                className="group relative flex items-start gap-2.5 rounded-xl px-2 py-2 transition hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800/70"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-indigo-300 dark:ring-zinc-700">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-5 text-zinc-800 dark:text-zinc-200" title={d.title}>
                    {d.title}
                  </p>
                  <p className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-zinc-500">
                    <span data-testid="doc-chunks">{d.chunks.length} chunks</span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span>{formatBytes(d.size)}</span>
                    <span
                      className={clsx(
                        "rounded px-1 py-px text-[10px] font-medium",
                        d.source === "sample"
                          ? "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
                      )}
                    >
                      {d.source === "sample" ? "sample" : "uploaded"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 sm:absolute sm:right-1.5 sm:top-1.5 sm:rounded-lg sm:bg-white sm:p-0.5 sm:opacity-0 sm:shadow-sm sm:ring-1 sm:ring-zinc-200 sm:transition sm:group-hover:opacity-100 sm:focus-within:opacity-100 dark:sm:bg-zinc-800 dark:sm:ring-zinc-700">
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${d.title}`}
                      title="Open source file"
                      className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    data-testid="doc-remove"
                    onClick={() => onRemove(d.id)}
                    aria-label={`Remove ${d.title}`}
                    title="Remove from index"
                    className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {canRestore && !loading && (
          <button
            type="button"
            onClick={onRestore}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore sample documents
          </button>
        )}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="rounded-xl bg-white p-3 text-[11px] leading-relaxed text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <p className="mb-1 font-semibold text-zinc-700 dark:text-zinc-300">How it works</p>
          Documents are chunked by heading, indexed with BM25 and a hashed TF-IDF vector, and the top passages are sent to
          the answer provider. Nothing leaves your browser in local mode.
        </div>
      </div>
    </aside>
  );
}
