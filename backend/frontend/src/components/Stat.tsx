import clsx from "clsx";

interface StatProps {
  label: string;
  value: string;
  healthy: boolean;
  helper?: string;
}

export function Stat({ label, value, healthy, helper }: StatProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-inner">
      <p className="text-sm uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <span
        className={clsx(
          "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
          healthy
            ? "bg-emerald-500/20 text-emerald-200"
            : "bg-rose-500/20 text-rose-200"
        )}
      >
        {healthy ? "Within SLO" : "Breach"}
      </span>
      {helper && <p className="mt-2 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
