"""Rollout management routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import rings
from ..dependencies import get_policy, get_store
from ..policy import PolicyEngine
from ..schemas import Rollout, RolloutDetail, ShouldPromoteRes
from ..store import Store

router = APIRouter(prefix="/v1/rollouts", tags=["rollouts"])


class RolloutCreate(BaseModel):
	target_version: str
	last_known_good: str


class ReasonPayload(BaseModel):
	reason: str | None = None


@router.post("", response_model=Rollout)
def create_rollout(
    payload: RolloutCreate,
    store: Store = Depends(get_store),
) -> Rollout:
    return store.create_rollout(payload.target_version, payload.last_known_good)


@router.get("", response_model=list[Rollout])
def list_rollouts(store: Store = Depends(get_store)) -> list[Rollout]:
	return store.list_rollouts()


@router.get("/{rollout_id}", response_model=RolloutDetail)
def get_rollout(rollout_id: str, store: Store = Depends(get_store)) -> RolloutDetail:
	if rollout_id not in store.rollouts:
		raise HTTPException(status_code=404, detail="Rollout not found")
	rollout = store.get_rollout(rollout_id)
	return RolloutDetail(rollout=rollout.to_schema(), decisions=store.rollout_decisions(rollout_id))


@router.post("/{rollout_id}/promote", response_model=Rollout)
def promote_rollout(
	rollout_id: str,
	store: Store = Depends(get_store),
	policy: PolicyEngine = Depends(get_policy),
) -> Rollout:
	if rollout_id not in store.rollouts:
		raise HTTPException(status_code=404, detail="Rollout not found")
	outcome = policy.evaluate_rollout(rollout_id)
	if not outcome.can_promote:
		raise HTTPException(status_code=400, detail="SLO gates failing or cooldown active")

	rollout = store.get_rollout(rollout_id)
	next_index = rings.next_ring_index(rollout.ring_index)
	if next_index is None:
		store.update_state(rollout_id, "completed")
		store.append_event(
			rollout_id,
			policy.build_decision(
				"PROMOTE",
				"Rollout completed",
				rings.ring_for(rollout.ring_index),
				outcome.metrics,
			),
		)
		return store.get_rollout(rollout_id).to_schema()

	store.update_ring_index(rollout_id, next_index)
	decision = policy.build_decision(
		"PROMOTE", "SLO gates passing", rings.ring_for(next_index), outcome.metrics
	)
	store.append_event(rollout_id, decision)
	return store.get_rollout(rollout_id).to_schema()


@router.post("/{rollout_id}/pause", response_model=Rollout)
def pause_rollout(
	rollout_id: str,
	payload: ReasonPayload | None = None,
	store: Store = Depends(get_store),
	policy: PolicyEngine = Depends(get_policy),
) -> Rollout:
	if rollout_id not in store.rollouts:
		raise HTTPException(status_code=404, detail="Rollout not found")
	reason = (payload.reason if payload else None) or "Manual pause"
	store.update_state(rollout_id, "paused")
	rollout = store.get_rollout(rollout_id)
	ring = rings.ring_for(rollout.ring_index)
	metrics = policy.evaluate_ring(ring)
	store.append_event(rollout_id, policy.build_decision("PAUSE", reason, ring, metrics))
	return rollout.to_schema()


@router.post("/{rollout_id}/rollback", response_model=Rollout)
def rollback_rollout(
	rollout_id: str,
	payload: ReasonPayload | None = None,
	store: Store = Depends(get_store),
	policy: PolicyEngine = Depends(get_policy),
) -> Rollout:
	if rollout_id not in store.rollouts:
		raise HTTPException(status_code=404, detail="Rollout not found")
	rollout = store.get_rollout(rollout_id)
	reason = (payload.reason if payload else None) or "Manual rollback"
	current_ring = rings.ring_for(rollout.ring_index)
	store.update_target_version(rollout_id, rollout.last_known_good)
	store.update_ring_index(rollout_id, max(0, rollout.ring_index - 1))
	store.update_state(rollout_id, "active")
	metrics = policy.evaluate_ring(current_ring)
	store.append_event(
		rollout_id,
		policy.build_decision("ROLLBACK", reason, current_ring, metrics),
	)
	return store.get_rollout(rollout_id).to_schema()


@router.get("/{rollout_id}/should_promote", response_model=ShouldPromoteRes)
def should_promote(
	rollout_id: str,
	store: Store = Depends(get_store),
	policy: PolicyEngine = Depends(get_policy),
) -> ShouldPromoteRes:
	if rollout_id not in store.rollouts:
		raise HTTPException(status_code=404, detail="Rollout not found")
	outcome = policy.evaluate_rollout(rollout_id)
	if outcome.can_promote:
		decision = "PROMOTE"
		reason = "All SLO gates passing and cooldown satisfied"
	elif outcome.auto_rollback:
		decision = "ROLLBACK"
		reason = "Critical thresholds breached"
	elif outcome.breaches:
		decision = "PAUSE"
		reason = f"SLO breaches detected: {', '.join(outcome.breaches)}"
	else:
		decision = "ADVISE_NO"
		reason = "Cooldown active"

	rollout = store.get_rollout(rollout_id)
	ring = rings.ring_for(rollout.ring_index)
	store.append_event(  # advisory event for observability
		rollout_id,
		policy.build_decision(decision, reason, ring, outcome.metrics),
		include_rollout_history=False,
	)

	return ShouldPromoteRes(
		decision=decision,  # type: ignore[arg-type]
		reason=reason,
		metrics=outcome.metrics.snapshot(),
		breaches=outcome.breaches,
	)
