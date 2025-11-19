import clsx from "clsx";
import type { Ring } from "../types";

const statusStyles: Record<
  "active" | "paused" | "completed" | "upcoming",
  string
> = {
  active: "border-emerald-500/80 bg-emerald-500/10",
  paused: "border-rose-400/80 bg-rose-500/10",
  completed: "border-slate-500/60 bg-slate-800/50",
  upcoming: "border-slate-700 bg-slate-900/60",
};

const ringPalette: Record<Ring, string> = {
  pilot: "from-sky-500/20",
  five: "from-indigo-500/20",
  twentyfive: "from-pink-400/20",
  all: "from-amber-300/20",
};

interface RingCardProps {
  ring: Ring;
  title: string;
  status: "active" | "paused" | "completed" | "upcoming";
  metrics?: {
    boot_success: number;
    crash_free_median: number;
    checkin_ms_median: number;
    breaches: string[];
  };
  sloTargets?: {
    boot: number;
    crash: number;
    latency: number;
  };
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function RingCard({
  ring,
  title,
  status,
  metrics,
  sloTargets,
}: RingCardProps) {
  const showMetrics = Boolean(metrics) && status !== "upcoming";
  const slo = sloTargets ?? { boot: 0.995, crash: 0.99, latency: 500 };
  const metricBadges = metrics
    ? [
        {
          label: "Boot",
          healthy: metrics.boot_success >= slo.boot,
          value: formatPercent(metrics.boot_success),
        },
        {
          label: "Crash",
          healthy: metrics.crash_free_median >= slo.crash,
          value: formatPercent(metrics.crash_free_median),
        },
        {
          label: "Latency",
          healthy: metrics.checkin_ms_median <= slo.latency,
          value: `${metrics.checkin_ms_median.toFixed(0)} ms`,
        },
      ]
    : [];
  return (
    <div
      className={clsx(
        "rounded-2xl border px-5 py-4 shadow-sm transition",
        statusStyles[status],
        status === "upcoming" && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <h3 className="text-xl font-semibold text-white">
            {ring.charAt(0).toUpperCase() + ring.slice(1)} ring
          </h3>
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
            status === "active" && "bg-emerald-500/20 text-emerald-300",
            status === "completed" && "bg-slate-500/20 text-slate-200",
            status === "paused" && "bg-rose-500/20 text-rose-200",
            status === "upcoming" && "bg-slate-700/60 text-slate-300"
          )}
        >
          {status}
        </span>
      </div>
      {showMetrics && metricBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {metricBadges.map((badge) => (
            <span
              key={badge.label}
              className={clsx(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                badge.healthy
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-100"
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  "h-2 w-2 rounded-full",
                  badge.healthy ? "bg-emerald-400" : "bg-rose-400"
                )}
              />
              <span className="font-semibold">{badge.label}</span>
              <span className="text-slate-200">{badge.value}</span>
            </span>
          ))}
        </div>
      )}
      {showMetrics && metrics && (
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-transparent to-slate-900/60 p-3">
            <p className="text-slate-400">Boot success</p>
            <p className="text-lg font-semibold text-white">
              {formatPercent(metrics.boot_success)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-transparent to-slate-900/60 p-3">
            <p className="text-slate-400">Crash free</p>
            <p className="text-lg font-semibold text-white">
              {formatPercent(metrics.crash_free_median)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-transparent to-slate-900/60 p-3">
            <p className="text-slate-400">Median ms</p>
            <p className="text-lg font-semibold text-white">
              {metrics.checkin_ms_median.toFixed(0)} ms
            </p>
          </div>
        </div>
      )}
      {!showMetrics && (
        <div
          className={clsx(
            "mt-4 rounded-xl border border-dashed border-white/5 bg-gradient-to-br to-transparent p-4 text-sm text-slate-400",
            ringPalette[ring]
          )}
        >
          {status === "upcoming"
            ? "Awaiting promotion"
            : status === "completed"
            ? "Deployment finished"
            : "No metrics available"}
        </div>
      )}
    </div>
  );
}
