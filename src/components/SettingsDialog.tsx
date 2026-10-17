"use client";

import { useEffect, useState } from "react";
import { Cpu, Eye, EyeOff, KeyRound, Lock, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { DEFAULT_SETTINGS, type AppSettings, type ProviderKind } from "@/lib/providers";

interface Props {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (s: AppSettings) => void;
}

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const PROVIDERS: { id: ProviderKind; title: string; desc: string; icon: typeof Cpu }[] = [
  { id: "local", title: "Local (extractive)", desc: "No key. Picks the best sentences from retrieved passages.", icon: Cpu },
  { id: "openai", title: "OpenAI-compatible", desc: "Your own key. Generates a grounded answer from the passages.", icon: Sparkles },
];

export default function SettingsDialog({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const needsKey = draft.provider === "openai" && !draft.apiKey.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="animate-fade-in absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-in relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl ring-1 ring-zinc-200 sm:rounded-2xl dark:bg-zinc-950 dark:ring-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 id="settings-title" className="text-base font-semibold">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Answer provider</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROVIDERS.map(({ id, title, desc, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`provider-${id}`}
                  onClick={() => set("provider", id)}
                  aria-pressed={draft.provider === id}
                  className={clsx(
                    "rounded-xl border p-3 text-left transition",
                    draft.provider === id
                      ? "border-indigo-400 bg-indigo-50/60 ring-4 ring-indigo-500/10 dark:border-indigo-500 dark:bg-indigo-500/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> {title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-zinc-500">{desc}</span>
                </button>
              ))}
            </div>
          </section>

          {draft.provider === "openai" && (
            <section className="animate-fade-in space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Base URL</span>
                <input
                  className={input}
                  value={draft.baseUrl}
                  onChange={(e) => set("baseUrl", e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  spellCheck={false}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">API key</span>
                <span className="relative block">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    className={clsx(input, "pl-9 pr-10 font-mono")}
                    type={showKey ? "text" : "password"}
                    value={draft.apiKey}
                    onChange={(e) => set("apiKey", e.target.value)}
                    placeholder="sk-…"
                    autoComplete="off"
                    spellCheck={false}
                    data-testid="api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    aria-label={showKey ? "Hide key" : "Show key"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Model</span>
                <input
                  className={input}
                  value={draft.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="gpt-4o-mini"
                  spellCheck={false}
                />
              </label>
              <p className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500 dark:bg-zinc-900">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Your key is stored only in this browser&apos;s localStorage and is sent directly to the base URL above. Any
                OpenAI-compatible API that allows browser (CORS) requests works, e.g. OpenAI, OpenRouter, Groq or a local
                Ollama server.
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Retrieval</h3>
            <div className="space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <label className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-zinc-600 dark:text-zinc-400">Top-k passages</span>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={draft.topK}
                  onChange={(e) => set("topK", Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-6 text-right font-mono tabular-nums">{draft.topK}</span>
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span>
                  <span className="block text-zinc-700 dark:text-zinc-300">Hybrid re-scoring</span>
                  <span className="block text-xs text-zinc-500">Blend BM25 with hashed TF-IDF cosine similarity</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.hybrid}
                  onChange={(e) => set("hybrid", e.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_SETTINGS })}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Reset &amp; clear key
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="settings-save"
              disabled={needsKey}
              onClick={() => onSave(draft)}
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
