import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Decisions({ decisions }) {
    const trimmed = decisions.slice(-10).reverse();
    if (!trimmed.length) {
        return (_jsx("div", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-400", children: "No decisions yet." }));
    }
    return (_jsx("ul", { className: "space-y-2 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm", "aria-live": "polite", children: trimmed.map((decision) => (_jsxs("li", { className: "flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-300", children: decision.kind }), _jsx("p", { className: "text-slate-200", children: decision.reason })] }), _jsx("time", { className: "text-xs text-slate-400", dateTime: decision.ts, children: new Date(decision.ts).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }) })] }, `${decision.ts}-${decision.kind}`))) }));
}
