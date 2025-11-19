import clsx from "clsx";
import type { RolloutState } from "../types";

interface ActionMeta {
  disabled: boolean;
  reason?: string | null;
}

interface ControlsProps {
  rolloutState: RolloutState;
  cooldownSeconds: number;
  onPromote: () => void;
  onPause: () => void;
  onResume: () => void;
  onRollback: () => void;
  actions: {
    promote: ActionMeta;
    pause: ActionMeta;
    resume: ActionMeta;
    rollback: ActionMeta;
  };
  busy?: boolean;
}

const buttonClass =
  "rounded-xl px-4 py-3 font-semibold transition-colors text-sm";

export function Controls({
  rolloutState,
  cooldownSeconds,
  onPromote,
  onPause,
  onResume,
  onRollback,
  actions,
  busy = false,
}: ControlsProps) {
  const showResume = rolloutState === "paused";
  const promoteDisabled = actions.promote.disabled || busy;
  const pauseDisabled = actions.pause.disabled || busy;
  const resumeDisabled = actions.resume.disabled || busy;
  const rollbackDisabled = actions.rollback.disabled || busy;

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4 shadow-inner">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={clsx(
            buttonClass,
            "bg-emerald-500/90 text-black hover:bg-emerald-400",
            (promoteDisabled || busy) && "pointer-events-none opacity-50"
          )}
          onClick={onPromote}
          disabled={promoteDisabled}
          title={busy ? "Action running…" : actions.promote.reason ?? undefined}
          aria-disabled={promoteDisabled}
        >
          Promote
        </button>
        <button
          type="button"
          className={clsx(
            buttonClass,
            "bg-yellow-500/80 text-black hover:bg-yellow-400",
            (pauseDisabled || busy) && "pointer-events-none opacity-50"
          )}
          onClick={onPause}
          disabled={pauseDisabled}
          title={busy ? "Action running…" : actions.pause.reason ?? undefined}
          aria-disabled={pauseDisabled}
        >
          Pause
        </button>
        {showResume && (
          <button
            type="button"
            className={clsx(
              buttonClass,
              "bg-sky-500/80 text-black hover:bg-sky-400",
              (resumeDisabled || busy) && "pointer-events-none opacity-50"
            )}
            onClick={onResume}
            disabled={resumeDisabled}
            title={
              busy ? "Action running…" : actions.resume.reason ?? undefined
            }
            aria-disabled={resumeDisabled}
          >
            Resume
          </button>
        )}
        <button
          type="button"
          className={clsx(
            buttonClass,
            "bg-rose-500/80 text-black hover:bg-rose-400",
            (rollbackDisabled || busy) && "pointer-events-none opacity-50"
          )}
          onClick={onRollback}
          disabled={rollbackDisabled}
          title={
            busy ? "Action running…" : actions.rollback.reason ?? undefined
          }
          aria-disabled={rollbackDisabled}
        >
          Rollback
        </button>
      </div>
      {cooldownSeconds > 0 && (
        <p className="text-sm text-slate-300">
          Cooldown: next promotion allowed in{" "}
          <strong>{cooldownSeconds}s</strong>
        </p>
      )}
      {showResume && (
        <p className="text-xs text-slate-400">
          Resume re-evaluates the rollout and dispatches a promotion request to
          continue the rollout.
        </p>
      )}
    </div>
  );
}
