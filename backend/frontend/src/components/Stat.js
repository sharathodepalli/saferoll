import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export function Stat({ label, value, healthy, helper }) {
    return (_jsxs("div", { className: "rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-inner", children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-400", children: label }), _jsx("p", { className: "mt-2 text-3xl font-semibold text-white", children: value }), _jsx("span", { className: clsx("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold", healthy
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-rose-500/20 text-rose-200"), children: healthy ? "Within SLO" : "Breach" }), helper && _jsx("p", { className: "mt-2 text-xs text-slate-400", children: helper })] }));
}
