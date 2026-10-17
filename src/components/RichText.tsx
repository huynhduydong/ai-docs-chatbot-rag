import { Fragment, type ReactNode } from "react";
import clsx from "clsx";

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g;
const LIST_ITEM_RE = /^\s*(?:[-*•]|\d+[.)])\s+/;

interface Props {
  text: string;
  typing?: boolean;
  onCite?: (n: number) => void;
}

function renderInline(s: string, onCite?: (n: number) => void): ReactNode[] {
  return s.split(INLINE_RE).map((part, i) => {
    if (!part) return null;
    if (/^\[\d+\]$/.test(part)) {
      const n = Number(part.slice(1, -1));
      return (
        <button
          key={i}
          type="button"
          onClick={() => onCite?.(n)}
          title={`Show source ${n}`}
          className="mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-indigo-50 px-1 align-[2px] text-[11px] font-semibold leading-none text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
        >
          {n}
        </button>
      );
    }
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`"))
      return (
        <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">
          {part.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Minimal markdown: paragraphs, bullet/numbered lists, bold, inline code and [n] citation markers. */
export default function RichText({ text, typing, onCite }: Props) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="space-y-3 text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">
      {blocks.map((block, bi) => {
        const last = bi === blocks.length - 1;
        const lines = block.split("\n").filter((l) => l.trim());
        const caret = clsx(last && typing && "typing-caret");
        if (lines.length && lines.every((l) => LIST_ITEM_RE.test(l))) {
          const ordered = /^\s*\d/.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={bi} className={clsx("space-y-1.5 pl-5", ordered ? "list-decimal" : "list-disc", "marker:text-zinc-400")}>
              {lines.map((l, li) => (
                <li key={li} className={clsx(li === lines.length - 1 && caret, "pl-1")}>
                  {renderInline(l.replace(LIST_ITEM_RE, ""), onCite)}
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={bi} className={caret}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(l, onCite)}
              </Fragment>
            ))}
          </p>
        );
      })}
      {!blocks.length && typing && <p className="typing-caret" />}
    </div>
  );
}
