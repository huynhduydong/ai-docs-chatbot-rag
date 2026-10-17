"use client";

import { Cpu, Moon, PanelLeft, Settings, Sparkles, SquarePen, Sun } from "lucide-react";
import clsx from "clsx";
import type { LLMProvider } from "@/lib/providers";

interface Props {
  provider: LLMProvider;
  dark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
  onNewChat?: () => void;
}

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export default function Header({ provider, dark, onToggleTheme, onOpenSettings, onOpenSidebar, onNewChat }: Props) {
  const local = provider.id === "local";
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200/80 bg-white/80 px-2 backdrop-blur sm:gap-3 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950/80">
      <button type="button" className={clsx(iconBtn, "md:hidden")} onClick={onOpenSidebar} aria-label="Open documents">
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-[17px] font-semibold tracking-tight">
          Docu<span className="text-indigo-600 dark:text-indigo-400">Mind</span>
        </span>
      </div>

      <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Demo · runs fully in your browser
      </span>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          data-testid="provider-badge"
          onClick={onOpenSettings}
          title="Change answer provider"
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
            local
              ? "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200",
          )}
        >
          {local ? <Cpu className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span className="max-w-[9rem] truncate">{local ? provider.name : `LLM · ${provider.name}`}</span>
        </button>
        {onNewChat && (
          <button type="button" className={iconBtn} onClick={onNewChat} aria-label="New chat" title="New chat">
            <SquarePen className="h-[18px] w-[18px]" />
          </button>
        )}
        <button
          type="button"
          className={iconBtn}
          onClick={onToggleTheme}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title="Toggle theme"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button
          type="button"
          data-testid="settings-button"
          className={iconBtn}
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
