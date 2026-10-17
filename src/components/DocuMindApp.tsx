"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HybridRetriever } from "@/lib/rag";
import { createProvider, DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from "@/lib/providers";
import { ingestFile, loadSampleDocs, SAMPLE_FILES, type DocRecord } from "@/lib/knowledge-base";
import Composer from "./Composer";
import EmptyState from "./EmptyState";
import Header from "./Header";
import { AssistantBubble, UserBubble, type AssistantMessage, type ChatMessage } from "./Messages";
import SettingsDialog from "./SettingsDialog";
import Sidebar, { type UploadStatus } from "./Sidebar";

const THEME_KEY = "documind:theme";
const MIN_THINKING_MS = 450;

let idCounter = 0;
const uid = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DocuMindApp() {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const retriever = useMemo(() => new HybridRetriever(docs.flatMap((d) => d.chunks)), [docs]);
  const provider = useMemo(() => createProvider(settings), [settings]);
  const busy = messages.some((m) => m.role === "assistant" && m.status === "pending");
  const canRestore = SAMPLE_FILES.some((f) => !docs.some((d) => d.source === "sample" && d.fileName === f));

  const restoreSamples = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const samples = await loadSampleDocs();
      setDocs((prev) => [...samples, ...prev.filter((d) => d.source !== "sample")]);
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Failed to load sample documents" });
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    setSettings(loadSettings());
    setDark(document.documentElement.classList.contains("dark"));
    void restoreSamples();
  }, [restoreSamples]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* storage disabled */
    }
  };

  const scrollToBottom = useCallback((force = false) => {
    const el = scrollRef.current;
    if (el && (force || stickToBottom.current)) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (messages.length) scrollToBottom();
    else scrollRef.current?.scrollTo({ top: 0 });
  }, [messages, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const updateAssistant = (id: string, patch: Partial<AssistantMessage>) =>
    setMessages((ms) => ms.map((m) => (m.id === id && m.role === "assistant" ? { ...m, ...patch } : m)));

  const ask = async (question: string) => {
    if (busy || !question.trim()) return;
    const assistantId = uid();
    const started = performance.now();
    const retrieval = retriever.retrieve(question, { topK: settings.topK, hybrid: settings.hybrid });

    stickToBottom.current = true;
    setMessages((ms) => [
      ...ms.map((m) => (m.role === "assistant" ? { ...m, animate: false } : m)),
      { id: uid(), role: "user", content: question },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "pending",
        animate: true,
        citations: [],
        grounded: false,
        retrieval,
        providerName: provider.name,
      },
    ]);

    try {
      const [answer] = await Promise.all([provider.answer(question, retrieval.results), sleep(MIN_THINKING_MS)]);
      updateAssistant(assistantId, {
        status: "done",
        content: answer.text,
        citations: answer.citations,
        grounded: answer.grounded,
        latencyMs: Math.round(performance.now() - started),
      });
    } catch (e) {
      updateAssistant(assistantId, {
        status: "error",
        content: e instanceof Error ? e.message : String(e),
        latencyMs: Math.round(performance.now() - started),
      });
    }
  };

  const onFiles = async (files: File[]) => {
    const added: DocRecord[] = [];
    const errors: string[] = [];
    for (const f of files) {
      try {
        added.push(await ingestFile(f));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `${f.name}: failed to read`);
      }
    }
    if (added.length) {
      setDocs((prev) => [...prev.filter((d) => !added.some((a) => a.id === d.id)), ...added]);
    }
    const chunks = added.reduce((s, d) => s + d.chunks.length, 0);
    if (errors.length) setStatus({ kind: "error", text: errors.join(" · ") });
    else if (added.length)
      setStatus({
        kind: "ok",
        text: `Indexed ${added.length === 1 ? `“${added[0].title}”` : `${added.length} files`} · ${chunks} chunks`,
      });
  };

  const removeDoc = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (doc) setStatus({ kind: "ok", text: `Removed “${doc.title}” from the index` });
  };

  const onTypingDone = useCallback((id: string) => updateAssistant(id, { animate: false }), []);
  const onTick = useCallback(() => scrollToBottom(), [scrollToBottom]);

  const noDocs = !loadingDocs && docs.length === 0;
  const sidebarProps = {
    docs,
    loading: loadingDocs,
    status,
    canRestore,
    onFiles,
    onRemove: removeDoc,
    onRestore: restoreSamples,
  };

  return (
    <div className="flex h-dvh flex-col">
      <Header
        provider={provider}
        dark={dark}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onNewChat={messages.length ? () => setMessages([]) : undefined}
      />

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Sidebar {...sidebarProps} />
        </div>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="animate-fade-in absolute inset-0 bg-zinc-950/40" onClick={() => setSidebarOpen(false)} />
            <div className="animate-fade-in absolute inset-y-0 left-0 shadow-2xl">
              <Sidebar {...sidebarProps} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} onScroll={onScroll} className="scroll-thin flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6 sm:px-6">
              {messages.length === 0 ? (
                <EmptyState onPick={ask} disabled={loadingDocs || noDocs} />
              ) : (
                <div className="space-y-8 pb-4">
                  {messages.map((m) =>
                    m.role === "user" ? (
                      <UserBubble key={m.id} message={m} />
                    ) : (
                      <AssistantBubble key={m.id} message={m} onTypingDone={onTypingDone} onTick={onTick} />
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
          <Composer
            onSend={ask}
            disabled={busy || loadingDocs || noDocs}
            placeholder={
              loadingDocs
                ? "Indexing documents…"
                : noDocs
                  ? "Upload a document to start asking questions"
                  : "Ask a question about your documents…"
            }
            footnote={
              provider.id === "local"
                ? "Local mode is extractive: answers are quoted from your documents. Add an API key in Settings for generated answers."
                : `Answers are generated by ${provider.name} using only the retrieved passages. Verify important details in the sources.`
            }
          />
        </main>
      </div>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => {
          setSettings(s);
          saveSettings(s);
          setSettingsOpen(false);
        }}
      />
    </div>
  );
}
