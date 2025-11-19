"""Promotion/pause/rollback policy evaluation for SafeRoll."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from . import rings
from .metrics import WindowMetrics
from .schemas import Decision, Ring
from .store import Store, utcnow

PROMOTE_COOLDOWN_SECONDS = 120
AUTO_ROLLBACK_CRASH = 0.950
AUTO_ROLLBACK_BOOT = 0.970


@dataclass
class PolicyOutcome:
	metrics: WindowMetrics
	can_promote: bool
	breaches: list[str]
	auto_rollback: bool


class PolicyEngine:
	"""Encapsulates the SafeRoll gating logic."""

	def __init__(self, store: Store) -> None:
		self.store = store

	def evaluate_ring(self, ring: Ring) -> WindowMetrics:
		return self.store.metrics_for_ring(ring)

	def evaluate_rollout(self, rollout_id: str, now: datetime | None = None) -> PolicyOutcome:
		rollout = self.store.get_rollout(rollout_id)
		ring = rings.ring_for(rollout.ring_index)
		metrics = self.evaluate_ring(ring)
		if now is None:
			now = utcnow()

		cooldown_ready = self.store.promote_cooldown_ready(
			rollout_id, PROMOTE_COOLDOWN_SECONDS, now
		)
		breaches = list(metrics.breaches)
		auto_rollback = self._needs_auto_rollback(metrics)
		can_promote = cooldown_ready and not breaches and rollout.state == "active"
		return PolicyOutcome(
			metrics=metrics,
			can_promote=can_promote,
			breaches=breaches,
			auto_rollback=auto_rollback,
		)

	def build_decision(
		self, kind: str, reason: str, ring: Ring, metrics: WindowMetrics
	) -> Decision:
		return Decision(
			ts=utcnow().isoformat(),
			kind=kind,  # type: ignore[arg-type]
			reason=reason,
			ring=ring,
			snapshot=metrics.snapshot(),
		)

	@staticmethod
	def _needs_auto_rollback(metrics: WindowMetrics) -> bool:
		return (
			metrics.crash_free_median < AUTO_ROLLBACK_CRASH
			or metrics.boot_success < AUTO_ROLLBACK_BOOT
		)
