import { useState } from "react";

const tabs = [
  { key: "about", label: "About" },
  { key: "pitch", label: "Pitch Deck" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function DocsPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>("about");

  return (
    <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 text-slate-100 shadow-xl">
      <nav className="mb-6 flex gap-2" aria-label="Documentation tabs">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800/70 text-slate-200 hover:bg-slate-800"
              }`}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      {activeTab === "about" ? <AboutTab /> : <PitchDeckTab />}
    </section>
  );
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
      description:
        "Device check-ins stream into SafeRoll every few seconds with ring + build metadata.",
    },
    {
      title: "Decide",
      description:
        "The policy engine evaluates sliding-window SLOs and decides Promote, Pause, or Rollback.",
    },
    {
      title: "Act",
      description:
        "Operators get one-click controls with full audit history, so aborting is instant and explainable.",
    },
  ];

  return (
    <div className="space-y-8 text-slate-200">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="space-y-4 lg:w-3/5">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Progressive Rollouts, Guardrails First
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-white">
            SafeRoll is the autopilot for staged mobile releases
          </h2>
          <p className="text-base text-slate-300">
            It keeps each ring (pilot → five → twentyfive → all) honest by
            continuously grading live device health. When a metric breaches, the
            rollout pauses automatically and gives the team context to resolve
            or roll back in seconds—before customers notice.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {guardrailMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/5 bg-slate-900/60 p-4"
              >
                <p className="text-2xl font-semibold text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {metric.label}
                </p>
                <p className="mt-2 text-xs text-slate-400">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <figure className="rounded-3xl border border-white/5 bg-slate-900/60 p-4 shadow-lg lg:w-2/5">
          <img
            src="/docs/about%20image.png"
            alt="Annotated view of SafeRoll explaining rings, metrics, and abort controls"
            className="max-h-80 w-full rounded-2xl object-cover"
            loading="lazy"
          />
          <figcaption className="mt-3 text-xs text-slate-400">
            About visual used in customer briefings—shows rings, policy engine,
            and the big red abort control.
          </figcaption>
        </figure>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-2">
        <article className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 shadow-inner">
          <h3 className="text-lg font-semibold text-white">Lifecycle</h3>
          <ul className="mt-3 space-y-3">
            {lifecycle.map((item) => (
              <li key={item.title}>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-slate-300">{item.description}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            SafeRoll keeps the full audit log so post-mortems can trace every
            promote, pause, and rollback decision.
          </p>
        </article>
        <article className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 shadow-inner">
          <h3 className="text-lg font-semibold text-white">Abort vs Pause</h3>
          <p className="mt-2 text-slate-300">
            Abort is the operator-friendly “big red button.” It instantly stops
            promotions, snapshots metrics, and alerts downstream systems so you
            can investigate without guessing which devices were touched.
          </p>
          <p className="mt-3 text-slate-300">
            Pause simply holds position at the current ring while metrics stay
            healthy. Abort is triggered when the policy engine spots critical
            breaches (crash-free &lt; 95% or boot success &lt; 97%) or when an
            operator clicks Rollback.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Both actions are reversible after the cooldown, and every decision
            is reflected in the timeline to keep execs in the loop.
          </p>
        </article>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm">
        <h3 className="text-lg font-semibold text-white">Get in touch</h3>
        <p className="mt-2 text-slate-300">
          Have a mobile fleet over a million devices? Schedule a walkthrough to
          see SafeRoll in action.
        </p>
        <a
          className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
          href="mailto:hello@saferoll.dev"
        >
          Contact SafeRoll
        </a>
      </div>
    </div>
  );
}

function PitchDeckTab() {
  return (
    <div className="space-y-6 text-sm text-slate-200">
      <article className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold text-white">Pitch deck</h3>
        <div className="mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-white/5 bg-slate-950">
          <iframe
            src="/docs/SafeRoll-Protecting-1M-Hospital-TVs-from-Update-Disasters.pdf#toolbar=0&navpanes=0"
            title="SafeRoll pitch deck"
            className="h-full w-full"
          />
        </div>
        <a
          className="mt-3 inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200"
          href="/docs/SafeRoll-Protecting-1M-Hospital-TVs-from-Update-Disasters.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Open PDF ↗
        </a>
      </article>
      <article className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold text-white">Demo walkthrough</h3>
        <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-white/5 bg-slate-950">
          <iframe
            src="https://drive.google.com/file/d/1qkgPHQFi2GQTyZqXyCBCWKoXIjnfYENc/preview"
            title="SafeRoll demo video"
            allow="autoplay"
            className="h-full w-full"
          />
        </div>
        <a
          className="mt-3 inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200"
          href="https://drive.google.com/file/d/1qkgPHQFi2GQTyZqXyCBCWKoXIjnfYENc/view?usp=sharing"
          target="_blank"
          rel="noreferrer"
        >
          Open video ↗
        </a>
      </article>
    </div>
  );
}
