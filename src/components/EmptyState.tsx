import { ArrowRight, CreditCard, Database, Gauge, Quote, Scissors, Search, Sparkles, Webhook } from "lucide-react";

export const STARTER_QUESTIONS = [
  { icon: CreditCard, label: "Pricing", q: "How much does the Team plan cost, and what happens if I exceed my quota?" },
  { icon: Gauge, label: "API", q: "What are the API rate limits and how should I handle a 429?" },
  { icon: Webhook, label: "Webhooks", q: "How do I verify webhook signatures?" },
  { icon: Database, label: "Security", q: "How long are backups and deleted objects retained?" },
];

const STEPS = [
  { icon: Scissors, title: "Chunk", text: "Split by headings into ~500 char passages" },
  { icon: Search, title: "Retrieve", text: "BM25 + hashed TF-IDF cosine re-score" },
  { icon: Quote, title: "Answer", text: "Grounded reply with [n] citations" },
];

export default function EmptyState({ onPick, disabled }: { onPick: (q: string) => void; disabled: boolean }) {
  return (
    <div className="animate-fade-in flex min-h-full flex-col items-center justify-center py-8 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-xl" />
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
        Ask your documents anything
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        DocuMind indexes the sample <span className="font-medium text-zinc-700 dark:text-zinc-300">Nimbus Cloud</span> docs
        (or your own files) right in your browser, retrieves the most relevant passages and answers with citations you can
        check.
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
        {STARTER_QUESTIONS.map(({ icon: Icon, label, q }) => (
          <button
            key={q}
            type="button"
            data-testid="starter-question"
            disabled={disabled}
            onClick={() => onPick(q)}
            className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
              <span className="mt-0.5 block text-sm leading-snug text-zinc-700 dark:text-zinc-300">{q}</span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
          </button>
        ))}
      </div>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-2 sm:gap-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="flex flex-col items-center gap-1.5 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-100 text-[10px] text-zinc-500 dark:bg-zinc-800">
                {i + 1}
              </span>
              <Icon className="h-3.5 w-3.5 text-indigo-500" />
              {title}
            </div>
            <p className="text-[11px] leading-snug text-zinc-400 sm:text-xs">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
