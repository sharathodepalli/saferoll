import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const tabs = [
    { key: "about", label: "About" },
    { key: "pitch", label: "Pitch Deck" },
];
export function DocsPanel() {
    const [activeTab, setActiveTab] = useState("about");
    return (_jsxs("section", { className: "rounded-3xl border border-white/5 bg-slate-900/70 p-6 text-slate-100 shadow-xl", children: [_jsx("nav", { className: "mb-6 flex gap-2", "aria-label": "Documentation tabs", children: tabs.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (_jsx("button", { type: "button", onClick: () => setActiveTab(tab.key), className: `rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive
                            ? "bg-slate-100 text-slate-900"
                            : "bg-slate-800/70 text-slate-200 hover:bg-slate-800"}`, "aria-pressed": isActive, children: tab.label }, tab.key));
                }) }), activeTab === "about" ? _jsx(AboutTab, {}) : _jsx(PitchDeckTab, {})] }));
}
function AboutTab() {
    const guardrailMetrics = [
        {
            label: "Boot success rate",
            value: "≥ 99.5%",
            detail: "Every ring must stay green over the last five minutes",
        },
        {
            label: "Crash-free median",
            value: "≥ 99.0%",
            detail: "Automatic pause if median stability dips",
        },
        {
            label: "Check-in latency",
            value: "≤ 500 ms",
            detail: "Signals regressions before users notice",
        },
    ];
    const lifecycle = [
        {
            title: "Observe",
            description: "Device check-ins stream into SafeRoll every few seconds with ring + build metadata.",
        },
        {
            title: "Decide",
            description: "The policy engine evaluates sliding-window SLOs and decides Promote, Pause, or Rollback.",
        },
        {
            title: "Act",
            description: "Operators get one-click controls with full audit history, so aborting is instant and explainable.",
        },
    ];
    return (_jsxs("div", { className: "space-y-8 text-slate-200", children: [_jsxs("div", { className: "flex flex-col gap-6 lg:flex-row", children: [_jsxs("div", { className: "space-y-4 lg:w-3/5", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-emerald-300", children: "Progressive Rollouts, Guardrails First" }), _jsx("h2", { className: "text-3xl font-semibold leading-tight text-white", children: "SafeRoll is the autopilot for staged mobile releases" }), _jsx("p", { className: "text-base text-slate-300", children: "It keeps each ring (pilot \u2192 five \u2192 twentyfive \u2192 all) honest by continuously grading live device health. When a metric breaches, the rollout pauses automatically and gives the team context to resolve or roll back in seconds\u2014before customers notice." }), _jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: guardrailMetrics.map((metric) => (_jsxs("div", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4", children: [_jsx("p", { className: "text-2xl font-semibold text-white", children: metric.value }), _jsx("p", { className: "mt-1 text-xs uppercase tracking-wide text-slate-400", children: metric.label }), _jsx("p", { className: "mt-2 text-xs text-slate-400", children: metric.detail })] }, metric.label))) })] }), _jsxs("figure", { className: "rounded-3xl border border-white/5 bg-slate-900/60 p-4 shadow-lg lg:w-2/5", children: [_jsx("img", { src: "/docs/about%20image.png", alt: "Annotated view of SafeRoll explaining rings, metrics, and abort controls", className: "max-h-80 w-full rounded-2xl object-cover", loading: "lazy" }), _jsx("figcaption", { className: "mt-3 text-xs text-slate-400", children: "About visual used in customer briefings\u2014shows rings, policy engine, and the big red abort control." })] })] }), _jsxs("div", { className: "grid gap-4 text-sm md:grid-cols-2", children: [_jsxs("article", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4 shadow-inner", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Lifecycle" }), _jsx("ul", { className: "mt-3 space-y-3", children: lifecycle.map((item) => (_jsxs("li", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: item.title }), _jsx("p", { className: "text-slate-300", children: item.description })] }, item.title))) }), _jsx("p", { className: "mt-4 text-xs text-slate-400", children: "SafeRoll keeps the full audit log so post-mortems can trace every promote, pause, and rollback decision." })] }), _jsxs("article", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4 shadow-inner", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Abort vs Pause" }), _jsx("p", { className: "mt-2 text-slate-300", children: "Abort is the operator-friendly \u201Cbig red button.\u201D It instantly stops promotions, snapshots metrics, and alerts downstream systems so you can investigate without guessing which devices were touched." }), _jsx("p", { className: "mt-3 text-slate-300", children: "Pause simply holds position at the current ring while metrics stay healthy. Abort is triggered when the policy engine spots critical breaches (crash-free < 95% or boot success < 97%) or when an operator clicks Rollback." }), _jsx("p", { className: "mt-3 text-xs text-slate-400", children: "Both actions are reversible after the cooldown, and every decision is reflected in the timeline to keep execs in the loop." })] })] }), _jsxs("div", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Get in touch" }), _jsx("p", { className: "mt-2 text-slate-300", children: "Have a mobile fleet over a million devices? Schedule a walkthrough to see SafeRoll in action." }), _jsx("a", { className: "mt-4 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200", href: "mailto:hello@saferoll.dev", children: "Contact SafeRoll" })] })] }));
}
function PitchDeckTab() {
    return (_jsxs("div", { className: "space-y-6 text-sm text-slate-200", children: [_jsxs("article", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Pitch deck" }), _jsx("div", { className: "mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-white/5 bg-slate-950", children: _jsx("iframe", { src: "/docs/SafeRoll-Protecting-1M-Hospital-TVs-from-Update-Disasters.pdf#toolbar=0&navpanes=0", title: "SafeRoll pitch deck", className: "h-full w-full" }) }), _jsx("a", { className: "mt-3 inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200", href: "/docs/SafeRoll-Protecting-1M-Hospital-TVs-from-Update-Disasters.pdf", target: "_blank", rel: "noreferrer", children: "Open PDF \u2197" })] }), _jsxs("article", { className: "rounded-2xl border border-white/5 bg-slate-900/60 p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Demo walkthrough" }), _jsx("div", { className: "mt-3 aspect-video overflow-hidden rounded-xl border border-white/5 bg-slate-950", children: _jsx("iframe", { src: "https://drive.google.com/file/d/1qkgPHQFi2GQTyZqXyCBCWKoXIjnfYENc/preview", title: "SafeRoll demo video", allow: "autoplay", className: "h-full w-full" }) }), _jsx("a", { className: "mt-3 inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200", href: "https://drive.google.com/file/d/1qkgPHQFi2GQTyZqXyCBCWKoXIjnfYENc/view?usp=sharing", target: "_blank", rel: "noreferrer", children: "Open video \u2197" })] })] }));
}
