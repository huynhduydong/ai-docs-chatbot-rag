"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, Copy, Info, Sparkles } from "lucide-react";
import type { Citation } from "@/lib/providers";
import type { RetrievalResult } from "@/lib/rag";
import { useTypewriter } from "@/lib/useTypewriter";
import Citations from "./Citations";
import RetrievalPanel from "./RetrievalPanel";
import RichText from "./RichText";

export interface UserMessage {
  id: string;
  role: "user";
  content: string;
}

export interface AssistantMessage {
  id: string;
  role: "assistant";
  content: string;
  status: "pending" | "done" | "error";
  /** Play the typing effect (only for the newest answer). */
  animate: boolean;
  citations: Citation[];
  grounded: boolean;
  retrieval?: RetrievalResult;
  providerName: string;
  latencyMs?: number;
}

export type ChatMessage = UserMessage | AssistantMessage;

export function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div data-testid="message-user" className="animate-fade-in flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-zinc-100 px-4 py-2.5 text-[15px] leading-7 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
        {message.content}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

function Thinking({ total }: { total?: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm text-zinc-500">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-indigo-500"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      Searching {total ?? ""} chunks and composing an answer…
    </div>
  );
}

interface AssistantProps {
  message: AssistantMessage;
  onTypingDone: (id: string) => void;
  onTick: () => void;
}

export function AssistantBubble({ message, onTypingDone, onTick }: AssistantProps) {
  const [openCitation, setOpenCitation] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { shown, typing } = useTypewriter(
    message.content,
    message.animate && message.status === "done",
    () => onTypingDone(message.id),
    onTick,
  );
  const citedIds = useMemo(() => new Set(message.citations.map((c) => c.chunkId)), [message.citations]);
  const queryTerms = message.retrieval?.queryTerms ?? [];
  const settled = message.status !== "pending" && !typing;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div data-testid="message-assistant" data-status={message.status} className="animate-fade-in flex gap-3.5">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">DocuMind</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>{message.providerName}</span>
          {message.latencyMs !== undefined && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="tabular-nums">{message.latencyMs} ms</span>
            </>
          )}
        </div>

        {message.status === "pending" ? (
          <Thinking total={message.retrieval?.totalChunks} />
        ) : message.status === "error" ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">The provider request failed.</p>
              <p className="mt-0.5 break-words opacity-90">{message.content}</p>
              <p className="mt-1 text-xs opacity-75">Check your key, base URL and model in Settings, or switch back to Local mode.</p>
            </div>
          </div>
        ) : (
          <RichText text={shown} typing={typing} onCite={setOpenCitation} />
        )}

        {settled && message.status === "done" && !message.grounded && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <Info className="h-3.5 w-3.5" />
            Retrieval confidence was too low to answer without guessing.
          </p>
        )}

        {settled && message.citations.length > 0 && (
          <Citations
            citations={message.citations}
            queryTerms={queryTerms}
            open={openCitation}
            onToggle={setOpenCitation}
          />
        )}

        {settled && message.retrieval && <RetrievalPanel retrieval={message.retrieval} citedIds={citedIds} />}

        {settled && message.status === "done" && (
          <div className="mt-2 flex">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
