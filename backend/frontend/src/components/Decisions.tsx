import type { Decision } from "../types";

interface DecisionsProps {
  decisions: Decision[];
}

export function Decisions({ decisions }: DecisionsProps) {
  const trimmed = decisions.slice(-10).reverse();

  if (!trimmed.length) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-400">
        No decisions yet.
      </div>
    );
  }

  return (
    <ul
      className="space-y-2 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm"
      aria-live="polite"
    >
      {trimmed.map((decision) => (
        <li
          key={`${decision.ts}-${decision.kind}`}
          className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              {decision.kind}
            </p>
            <p className="text-slate-200">{decision.reason}</p>
          </div>
          <time className="text-xs text-slate-400" dateTime={decision.ts}>
            {new Date(decision.ts).toLocaleString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </li>
      ))}
    </ul>
  );
}
