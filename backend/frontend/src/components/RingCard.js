import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
const statusStyles = {
    active: "border-emerald-500/80 bg-emerald-500/10",
    paused: "border-rose-400/80 bg-rose-500/10",
    completed: "border-slate-500/60 bg-slate-800/50",
    upcoming: "border-slate-700 bg-slate-900/60",
};
const ringPalette = {
    pilot: "from-sky-500/20",
    five: "from-indigo-500/20",
    twentyfive: "from-pink-400/20",
    all: "from-amber-300/20",
};
function formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
}
export function RingCard({ ring, title, status, metrics, sloTargets, }) {
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
    return (_jsxs("div", { className: clsx("rounded-2xl border px-5 py-4 shadow-sm transition", statusStyles[status], status === "upcoming" && "opacity-60"), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-400", children: title }), _jsxs("h3", { className: "text-xl font-semibold text-white", children: [ring.charAt(0).toUpperCase() + ring.slice(1), " ring"] })] }), _jsx("span", { className: clsx("rounded-full px-3 py-1 text-xs font-semibold capitalize", status === "active" && "bg-emerald-500/20 text-emerald-300", status === "completed" && "bg-slate-500/20 text-slate-200", status === "paused" && "bg-rose-500/20 text-rose-200", status === "upcoming" && "bg-slate-700/60 text-slate-300"), children: status })] }), showMetrics && metricBadges.length > 0 && (_jsx("div", { className: "mt-3 flex flex-wrap gap-2 text-xs", children: metricBadges.map((badge) => (_jsxs("span", { className: clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", badge.healthy
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-100"), children: [_jsx("span", { "aria-hidden": true, className: clsx("h-2 w-2 rounded-full", badge.healthy ? "bg-emerald-400" : "bg-rose-400") }), _jsx("span", { className: "font-semibold", children: badge.label }), _jsx("span", { className: "text-slate-200", children: badge.value })] }, badge.label))) })), showMetrics && metrics && (_jsxs("div", { className: "mt-4 grid grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { className: "rounded-xl border border-white/5 bg-gradient-to-br from-transparent to-slate-900/60 p-3", children: [_jsx("p", { className: "text-slate-400", children: "Boot success" }), _jsx("p", { className: "text-lg font-semibold text-white", children: formatPercent(metrics.boot_success) })] }), _jsxs("div", { className: "rounded-xl border border-white/5 bg-gradient-to-br from-transparent to-slate-900/60 p-3", children: [_jsx("p", { className: "text-slate-400", children: "Crash free" }), _jsx("p", { className: "text-lg font-semibold text-white", children: formatPercent(metrics.crash_free_median) })] }), _jsxs("div", { className: "rounded-xl border border-white/5 bg-gradient-to-br from-transparent to-slate-900/60 p-3", children: [_jsx("p", { className: "text-slate-400", children: "Median ms" }), _jsxs("p", { className: "text-lg font-semibold text-white", children: [metrics.checkin_ms_median.toFixed(0), " ms"] })] })] })), !showMetrics && (_jsx("div", { className: clsx("mt-4 rounded-xl border border-dashed border-white/5 bg-gradient-to-br to-transparent p-4 text-sm text-slate-400", ringPalette[ring]), children: status === "upcoming"
                    ? "Awaiting promotion"
                    : status === "completed"
                        ? "Deployment finished"
                        : "No metrics available" }))] }));
}
