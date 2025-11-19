"""Pydantic schemas for SafeRoll API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Ring = Literal["pilot", "five", "twentyfive", "all"]


class Health(BaseModel):
	"""Device health payload captured during check-ins."""

	boot_ok: bool
	crash_free: float
	checkin_ms: int


class CheckinReq(BaseModel):
	"""Inbound check-in request posted by the simulator or devices."""

	device_id: str
	ring: Ring
	sw_version: str
	last_config: str | None = None
	health: Health
	ts: str


class CheckinRes(BaseModel):
	"""Standard response advising the device on next steps."""

	rollout_id: str
	apply: dict[str, str | None] = Field(
		default_factory=lambda: {"target_version": None, "config_delta": None}
	)
	next_check_seconds: int = 30
	policy: dict[str, str] = Field(
		default_factory=lambda: {"backoff": "exp-jitter", "max_retries": "5"}
	)


class Rollout(BaseModel):
	rollout_id: str
	target_version: str
	last_known_good: str
	state: Literal["active", "paused", "completed"]
	ring_index: int
	created_at: str


class Decision(BaseModel):
	ts: str
	kind: Literal["PROMOTE", "PAUSE", "ROLLBACK", "ADVISE_NO"]
	reason: str
	ring: Ring
	snapshot: dict[str, float]


class MetricsRes(BaseModel):
	active_rollout_id: str
	active_ring: Ring
	window_seconds: int
	boot_success: float
	crash_free_median: float
	checkin_ms_median: float
	breaches: list[str]


class RolloutDetail(BaseModel):
	"""Helper schema for GET /v1/rollouts/{id}."""

	rollout: Rollout
	decisions: list[Decision]


class ShouldPromoteRes(BaseModel):
	"""Optional advisory endpoint response payload."""

	decision: Literal["PROMOTE", "PAUSE", "ROLLBACK", "ADVISE_NO"]
	reason: str
	metrics: dict[str, float]
	breaches: list[str]
