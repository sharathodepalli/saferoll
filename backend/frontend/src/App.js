import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import clsx from "clsx";
import { API_BASE, fetchMetrics, fetchRolloutDetail, postPause, postPromote, postRollback, } from "./api";
import { RingCard } from "./components/RingCard";
import { Controls } from "./components/Controls";
import { Stat } from "./components/Stat";
import { Decisions } from "./components/Decisions";
import { DocsPanel } from "./components/DocsPanel";
const RINGS = [
    { key: "pilot", title: "Pilot (0.1%)" },
    { key: "five", title: "Five Percent" },
    { key: "twentyfive", title: "Twenty Five Percent" },
    { key: "all", title: "All Devices" },
];
const BOOT_GATE = 0.995;
const CRASH_GATE = 0.99;
const LATENCY_GATE = 500;
const PROMOTE_COOLDOWN_SECONDS = 120;
const VIEW_TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "docs", label: "Docs" },
];
const isNoRolloutError = (error) => error instanceof Error && /no active rollout/i.test(error.message);
function formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
}
export default function App() {
    const queryClient = useQueryClient();
    const [now, setNow] = useState(() => Date.now());
    const [activeView, setActiveView] = useState("dashboard");
    const [copiedKey, setCopiedKey] = useState(null);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const metricsQuery = useQuery({
        queryKey: ["metrics"],
        queryFn: fetchMetrics,
        refetchInterval: 2000,
        refetchOnWindowFocus: false,
        staleTime: 2000,
        retry: (failureCount, error) => {
            if (isNoRolloutError(error)) {
                return false;
            }
            return failureCount < 2;
        },
    });
    const activeRolloutId = metricsQuery.data?.active_rollout_id ?? null;
    const rolloutQuery = useQuery({
        queryKey: ["rollout", activeRolloutId],
        queryFn: () => fetchRolloutDetail(activeRolloutId),
        enabled: Boolean(activeRolloutId),
        refetchInterval: 2000,
        refetchOnWindowFocus: false,
        staleTime: 2000,
    });
    const rollout = rolloutQuery.data?.rollout ?? null;
    const decisions = rolloutQuery.data?.decisions ?? [];
    const lastPromoteTs = useMemo(() => {
        const promote = [...decisions].reverse().find((d) => d.kind === "PROMOTE");
        return promote ? Date.parse(promote.ts) : null;
    }, [decisions]);
    const cooldownRemainingMs = useMemo(() => {
        if (!lastPromoteTs)
            return 0;
        const elapsed = now - lastPromoteTs;
        return Math.max(0, PROMOTE_COOLDOWN_SECONDS * 1000 - elapsed);
    }, [lastPromoteTs, now]);
    const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["metrics"] });
        if (activeRolloutId) {
            queryClient.invalidateQueries({ queryKey: ["rollout", activeRolloutId] });
        }
    }, [queryClient, activeRolloutId]);
    const pushToast = useCallback((kind, message, id) => {
        toast.dismiss(id);
        if (kind === "success") {
            toast.success(message, { id });
        }
        else {
            toast.error(message, { id });
        }
    }, []);
    const promoteMutation = useMutation({
        mutationFn: () => postPromote(activeRolloutId),
        onSuccess: (updated) => pushToast("success", `Promoted to ring index ${updated.ring_index}`, "promote-success"),
        onError: (err) => pushToast("error", err.message, "promote-error"),
        onSettled: invalidateAll,
    });
    const pauseMutation = useMutation({
        mutationFn: () => postPause(activeRolloutId, "Manual pause from dashboard"),
        onSuccess: () => pushToast("success", "Rollout paused", "pause-success"),
        onError: (err) => pushToast("error", err.message, "pause-error"),
        onSettled: invalidateAll,
    });
    const resumeMutation = useMutation({
        mutationFn: () => postPromote(activeRolloutId),
        onSuccess: () => pushToast("success", "Resume request promoted to next ring", "resume-success"),
        onError: (err) => pushToast("error", err.message, "resume-error"),
        onSettled: invalidateAll,
    });
    const rollbackMutation = useMutation({
        mutationFn: () => postRollback(activeRolloutId, "Manual rollback from dashboard"),
        onSuccess: () => pushToast("success", "Rollback initiated", "rollback-success"),
        onError: (err) => pushToast("error", err.message, "rollback-error"),
        onSettled: invalidateAll,
    });
    const loading = metricsQuery.isLoading || (activeRolloutId && rolloutQuery.isLoading);
    const metricsError = metricsQuery.error;
    const noRollout = isNoRolloutError(metricsError);
    const showErrorBanner = Boolean(metricsError && !noRollout);
    const metrics = metricsQuery.data ?? null;
    const breaches = metrics?.breaches ?? [];
    const finalRingReached = rollout
        ? rollout.ring_index >= RINGS.length - 1
        : false;
    const actionMeta = useMemo(() => {
        const base = {
            promote: { disabled: true, reason: "No active rollout" },
            pause: { disabled: true, reason: "No active rollout" },
            resume: { disabled: true, reason: "Nothing to resume" },
            rollback: { disabled: true, reason: "No active rollout" },
        };
        if (!rollout) {
            return base;
        }
        const breachReason = breaches.length
            ? `SLO breaches: ${breaches.join(", ")}`
            : null;
        const cooldownReason = cooldownSeconds > 0 ? `Cooling down (${cooldownSeconds}s left)` : null;
        const promoteReason = rollout.state !== "active"
            ? `Rollout ${rollout.state}`
            : breachReason ??
                cooldownReason ??
                (finalRingReached ? "Already at final ring" : null);
        const pauseReason = rollout.state === "paused"
            ? "Already paused"
            : rollout.state === "completed"
                ? "Rollout completed"
                : null;
        const resumeReason = rollout.state !== "paused"
            ? "Rollout not paused"
            : finalRingReached
                ? "Already at final ring"
                : null;
        const rollbackReason = rollout.state === "completed" ? "Rollout completed" : null;
        return {
            promote: { disabled: Boolean(promoteReason), reason: promoteReason },
            pause: { disabled: Boolean(pauseReason), reason: pauseReason },
            resume: { disabled: Boolean(resumeReason), reason: resumeReason },
            rollback: { disabled: Boolean(rollbackReason), reason: rollbackReason },
        };
    }, [rollout, breaches, cooldownSeconds, finalRingReached]);
    const metricStats = metrics
        ? [
            {
                label: "Boot success",
                value: formatPercent(metrics.boot_success),
                healthy: metrics.boot_success >= BOOT_GATE,
                helper: `>= ${(BOOT_GATE * 100).toFixed(1)}%`,
            },
            {
                label: "Crash free",
                value: formatPercent(metrics.crash_free_median),
                healthy: metrics.crash_free_median >= CRASH_GATE,
                helper: `>= ${(CRASH_GATE * 100).toFixed(1)}%`,
            },
            {
                label: "Median latency",
                value: `${metrics.checkin_ms_median.toFixed(0)} ms`,
                healthy: metrics.checkin_ms_median <= LATENCY_GATE,
                helper: `<= ${LATENCY_GATE} ms`,
            },
        ]
        : [];
    const isActing = promoteMutation.isPending ||
        pauseMutation.isPending ||
        resumeMutation.isPending ||
        rollbackMutation.isPending;
    const statusChip = useMemo(() => {
        if (!rollout)
            return null;
        if (rollout.state === "paused") {
            return {
                label: "Paused",
                description: "Rollout is paused",
                className: "bg-rose-500/20 text-rose-100",
            };
        }
        if (breaches.length > 0) {
            return {
                label: "Breaches",
                description: `SLO breaches: ${breaches.join(", ")}`,
                className: "bg-rose-500/20 text-rose-100",
            };
        }
        if (cooldownSeconds > 0) {
            return {
                label: "Cooldown",
                description: `Next promotion in ${cooldownSeconds}s`,
                className: "bg-amber-500/20 text-amber-100",
            };
        }
        return {
            label: "Active",
            description: "All SLO gates green",
            className: "bg-emerald-500/20 text-emerald-100",
        };
    }, [rollout, breaches, cooldownSeconds]);
    const ringCards = RINGS.map((ring, index) => {
        let status = "upcoming";
        if (rollout) {
            if (index < rollout.ring_index)
                status = "completed";
            else if (index === rollout.ring_index) {
                if (rollout.state === "completed")
                    status = "completed";
                else if (rollout.state === "paused")
                    status = "paused";
                else
                    status = "active";
            }
        }
        return (_jsx(RingCard, { ring: ring.key, title: ring.title, status: status, sloTargets: {
                boot: BOOT_GATE,
                crash: CRASH_GATE,
                latency: LATENCY_GATE,
            }, metrics: status === "active" && metrics
                ? {
                    boot_success: metrics.boot_success,
                    crash_free_median: metrics.crash_free_median,
                    checkin_ms_median: metrics.checkin_ms_median,
                    breaches,
                }
                : undefined }, ring.key));
    });
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 px-6 py-8 text-slate-100", children: [_jsx(Toaster, { position: "bottom-right" }), _jsxs("header", { className: "mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-400", children: "SafeRoll rollout control" }), _jsx("h1", { className: "text-3xl font-semibold text-white", children: "Progressive Rollout Dashboard" }), rollout && (_jsxs("p", { className: "text-sm text-slate-400", children: ["Target version ", rollout.target_version, " \u00B7 Last known good", " ", rollout.last_known_good] }))] }), _jsxs("div", { className: "flex flex-col gap-3 text-sm lg:items-end", children: [rollout && (_jsxs("div", { className: "space-y-1 text-right", children: [_jsxs("span", { className: "block text-slate-400", children: ["Rollout id: ", rollout.rollout_id] }), _jsxs("span", { className: "block text-slate-400", children: ["Active ring: ", RINGS[rollout.ring_index]?.title ?? "Unknown"] }), statusChip && (_jsx("span", { className: clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusChip.className), children: statusChip.label })), statusChip && (_jsx("p", { className: "text-xs text-slate-400", children: statusChip.description })), breaches.length > 0 && (_jsx("div", { className: "flex flex-wrap justify-end gap-1", children: breaches.map((breach) => (_jsx("span", { className: "rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-100", children: breach }, breach))) }))] })), _jsx("nav", { className: "flex gap-2", "aria-label": "Primary navigation", children: VIEW_TABS.map((tab) => {
                                    const isActive = tab.key === activeView;
                                    return (_jsx("button", { type: "button", onClick: () => setActiveView(tab.key), className: clsx("rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2", isActive
                                            ? "bg-slate-100 text-slate-900"
                                            : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"), "aria-pressed": isActive, children: tab.label }, tab.key));
                                }) })] })] }), activeView === "docs" ? (_jsx(DocsPanel, {})) : (_jsxs("div", { className: "space-y-4", children: [showErrorBanner && (_jsx("div", { className: "rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-100", children: "Unable to load metrics. Ensure the backend is running on http://localhost:8000." })), loading && !showErrorBanner && (_jsx("div", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-slate-300", children: "Loading rollout data\u2026" })), !loading && noRollout && (_jsx(QuickStartPanel, { apiBase: API_BASE, copiedKey: copiedKey, onCopy: (key, command) => {
                            if (!navigator?.clipboard) {
                                toast.error("Clipboard API unavailable. Copy manually.", {
                                    id: "copy-error",
                                });
                                return;
                            }
                            navigator.clipboard.writeText(command).then(() => {
                                setCopiedKey(key);
                                setTimeout(() => setCopiedKey(null), 2000);
                            }, () => toast.error("Unable to copy. Please copy manually.", {
                                id: "copy-error",
                            }));
                        } })), !loading && !showErrorBanner && rollout && metrics && (_jsxs("div", { className: "grid gap-6 lg:grid-cols-[2fr_1fr]", children: [_jsxs("section", { className: "space-y-6", children: [_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: ringCards }), _jsx(Controls, { rolloutState: rollout.state, cooldownSeconds: cooldownSeconds, onPromote: () => promoteMutation.mutate(), onPause: () => pauseMutation.mutate(), onResume: () => resumeMutation.mutate(), onRollback: () => rollbackMutation.mutate(), actions: actionMeta, busy: isActing })] }), _jsxs("aside", { className: "space-y-6", children: [_jsx("div", { className: "grid gap-4", children: metricStats.map((stat) => (_jsx(Stat, { ...stat }, stat.label))) }), _jsxs("div", { children: [_jsx("p", { className: "mb-3 text-sm uppercase tracking-wide text-slate-400", children: "Recent decisions" }), _jsx(Decisions, { decisions: decisions })] })] })] }))] }))] }));
}
function QuickStartPanel({ apiBase, copiedKey, onCopy }) {
    const seedCommand = `curl -X POST ${apiBase}/v1/rollouts -H 'Content-Type: application/json' -d '{"target_version":"1.2.3","last_known_good":"1.2.2","description":"Cloud demo rollout"}'`;
    const simCommand = `API_URL=${apiBase} poetry run python simulator/cli.py`;
    return (_jsxs("div", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-6 text-sm text-slate-300", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-emerald-300", children: "Ready-to-run demo" }), _jsx("h2", { className: "mt-1 text-2xl font-semibold text-white", children: "No active rollout yet" }), _jsx("p", { className: "mt-2 text-base text-slate-200", children: "Share these commands with reviewers so they can spin up a pilot ring instantly. Seed a rollout, then watch SafeRoll promote/pause via the simulator." }), _jsxs("div", { className: "mt-5 grid gap-4 md:grid-cols-2", children: [_jsx(QuickStartCard, { title: "1. Seed a rollout", description: "Creates a pilot targeting version 1.2.3.", command: seedCommand, buttonLabel: copiedKey === "seed" ? "Copied" : "Copy curl", onCopy: () => onCopy("seed", seedCommand) }), _jsx(QuickStartCard, { title: "2. Stream check-ins", description: "Runs the simulator against the hosted API.", command: simCommand, buttonLabel: copiedKey === "sim" ? "Copied" : "Copy command", onCopy: () => onCopy("sim", simCommand) })] }), _jsx("p", { className: "mt-4 text-xs text-slate-400", children: "Tip: the Docs tab includes the full architecture PDF and demo video if viewers want more context before running the sim." })] }));
}
function QuickStartCard({ title, description, command, buttonLabel, onCopy, }) {
    return (_jsxs("article", { className: "rounded-2xl border border-white/5 bg-slate-950/70 p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-400", children: title }), _jsx("p", { className: "text-base text-slate-200", children: description })] }), _jsx("button", { type: "button", onClick: onCopy, className: "rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-300", children: buttonLabel })] }), _jsx("pre", { className: "mt-3 overflow-x-auto rounded-xl border border-white/5 bg-slate-900/80 p-3 text-[0.75rem] text-slate-100", children: _jsx("code", { children: command }) })] }));
}
