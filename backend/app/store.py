"""Simple in-memory data store backing the SafeRoll API."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from . import metrics, rings
from .schemas import CheckinReq, Decision, Health, Ring, Rollout

WINDOW_SECONDS = metrics.WINDOW_SECONDS
MAX_WINDOW_LEN = 1200
MAX_DECISIONS = 10


def utcnow() -> datetime:
    return datetime.now(UTC)


def parse_ts(value: str) -> datetime:
    """Parse ISO8601 timestamps, accepting a trailing 'Z'."""

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return utcnow()


@dataclass
class RolloutState:
    rollout_id: str
    target_version: str
    last_known_good: str
    state: str
    ring_index: int
    created_at: datetime
    last_promote_ts: datetime | None = None
    last_pause_ts: datetime | None = None
    decisions: deque[Decision] = field(default_factory=lambda: deque(maxlen=MAX_DECISIONS))

    def to_schema(self) -> Rollout:
        return Rollout(
            rollout_id=self.rollout_id,
            target_version=self.target_version,
            last_known_good=self.last_known_good,
            state=self.state,  # type: ignore[arg-type]
            ring_index=self.ring_index,
            created_at=self.created_at.isoformat(),
        )


class Store:
    """Owns rollout state, health windows, and decision log."""

    def __init__(self) -> None:
        self.rollouts: dict[str, RolloutState] = {}
        self._active_rollout_id: str | None = None
        self.events: list[Decision] = []
        self._health_windows: dict[Ring, deque[tuple[datetime, Health]]] = {
            ring: deque(maxlen=MAX_WINDOW_LEN) for ring in rings.RINGS
        }

	# ------------------------------------------------------------------
	# Health window helpers
	# ------------------------------------------------------------------
    def record_checkin(self, payload: CheckinReq) -> None:
        ts = parse_ts(payload.ts)
        window = self._health_windows[payload.ring]
        window.append((ts, payload.health))
        self._prune_ring(payload.ring)

    def _prune_ring(self, ring: Ring, now: datetime | None = None) -> None:
        if now is None:
            now = utcnow()
        cutoff = now - timedelta(seconds=WINDOW_SECONDS)
        window = self._health_windows[ring]
        while window and window[0][0] < cutoff:
            window.popleft()

    def current_ring_events(self, ring: Ring) -> list[Health]:
        self._prune_ring(ring)
        return [health for _, health in self._health_windows[ring]]

	# ------------------------------------------------------------------
	# Rollout helpers
	# ------------------------------------------------------------------
    def create_rollout(self, target_version: str, last_known_good: str) -> Rollout:
        rollout_id = f"r-{uuid4().hex[:8]}"
        now = utcnow()
        rollout = RolloutState(
            rollout_id=rollout_id,
            target_version=target_version,
            last_known_good=last_known_good,
            state="active",
            ring_index=0,
            created_at=now,
        )
        self.rollouts[rollout_id] = rollout
        self._active_rollout_id = rollout_id
        return rollout.to_schema()

    def active_rollout(self) -> RolloutState | None:
        if self._active_rollout_id is None:
            return None
        return self.rollouts.get(self._active_rollout_id)

    def set_active_rollout(self, rollout_id: str) -> None:
        if rollout_id not in self.rollouts:
            raise KeyError(f"Unknown rollout_id {rollout_id}")
        self._active_rollout_id = rollout_id

    def get_rollout(self, rollout_id: str) -> RolloutState:
        return self.rollouts[rollout_id]

    def list_rollouts(self) -> list[Rollout]:
        return [rollout.to_schema() for rollout in self.rollouts.values()]

    def update_ring_index(self, rollout_id: str, new_index: int) -> None:
        rollout = self.get_rollout(rollout_id)
        rollout.ring_index = new_index

    def update_state(self, rollout_id: str, state: str) -> None:
        rollout = self.get_rollout(rollout_id)
        rollout.state = state

    def update_target_version(self, rollout_id: str, target_version: str) -> None:
        rollout = self.get_rollout(rollout_id)
        rollout.target_version = target_version

    def promote_cooldown_ready(
        self, rollout_id: str, cooldown_seconds: int, now: datetime | None = None
    ) -> bool:
        rollout = self.get_rollout(rollout_id)
        last_promote = rollout.last_promote_ts
        if last_promote is None:
            return True
        if now is None:
            now = utcnow()
        return (now - last_promote).total_seconds() >= cooldown_seconds

	# ------------------------------------------------------------------
	# Decisions and events
	# ------------------------------------------------------------------
    def append_event(
        self, rollout_id: str, decision: Decision, *, include_rollout_history: bool = True
    ) -> None:
        rollout = self.get_rollout(rollout_id)
        if include_rollout_history:
            rollout.decisions.append(decision)
        self.events.append(decision)

        if not include_rollout_history:
            return

        ts = parse_ts(decision.ts)
        if decision.kind == "PROMOTE":
            rollout.last_promote_ts = ts
        elif decision.kind == "PAUSE":
            rollout.last_pause_ts = ts

    def rollout_decisions(self, rollout_id: str) -> list[Decision]:
        rollout = self.get_rollout(rollout_id)
        return list(rollout.decisions)

	# ------------------------------------------------------------------
	# Utilities
	# ------------------------------------------------------------------
    def metrics_for_ring(self, ring: Ring) -> metrics.WindowMetrics:
        return metrics.compute_window_metrics(self.current_ring_events(ring))

    def snapshot(self) -> dict[str, object]:
        """Return a lightweight snapshot for debugging or future observability hooks."""

        rollout = self.active_rollout()
        ring = None
        if rollout:
            ring = rings.ring_for(rollout.ring_index)
        return {
            "active_rollout_id": rollout.rollout_id if rollout else None,
            "active_ring": ring,
            "events": len(self.events),
        }
