"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import clsx from "clsx";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  footnote: string;
}

export default function Composer({ onSend, disabled, placeholder, footnote }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = !disabled && value.trim().length > 0;
  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="bg-linear-to-t from-white via-white to-white/0 px-4 pb-4 pt-2 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950/0 sm:px-6">
      <form
        className="mx-auto max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white p-2 pl-4 shadow-lg shadow-zinc-900/5 transition focus-within:border-zinc-300 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30 dark:focus-within:border-zinc-700">
          <textarea
            ref={ref}
            data-testid="chat-input"
            rows={1}
            value={value}
            placeholder={placeholder}
            aria-label="Ask a question about your documents"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <button
            type="submit"
            data-testid="send-button"
            disabled={!canSend}
            aria-label="Send"
            className={clsx(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
              canSend
                ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                : "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600",
            )}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-zinc-400">{footnote}</p>
      </form>
    </div>
  );
}
