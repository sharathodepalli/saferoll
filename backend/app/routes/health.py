"""Check-in route handling device health events."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from .. import rings
from ..dependencies import get_policy, get_store
from ..policy import PolicyEngine
from ..schemas import CheckinReq, CheckinRes
from ..store import Store

router = APIRouter(prefix="/v1", tags=["checkin"])


@router.post("/checkin", response_model=CheckinRes)
def post_checkin(
    payload: CheckinReq,
    store: Store = Depends(get_store),
    policy: PolicyEngine = Depends(get_policy),
) -> CheckinRes:
    """Record the check-in and return advisory for the simulator."""

    store.record_checkin(payload)

    rollout = store.active_rollout()
    rollout_id = rollout.rollout_id if rollout else ""
    if rollout and rings.ring_for(rollout.ring_index) == payload.ring:
        outcome = policy.evaluate_rollout(rollout.rollout_id)
        ring_label = rings.ring_for(rollout.ring_index)
        if outcome.auto_rollback:
            store.update_target_version(rollout.rollout_id, rollout.last_known_good)
            store.update_ring_index(rollout.rollout_id, max(0, rollout.ring_index - 1))
            store.update_state(rollout.rollout_id, "active")
            store.append_event(
                rollout.rollout_id,
                policy.build_decision(
                    "ROLLBACK",
                    "Auto-rollback: critical SLO breach",
                    ring_label,
                    outcome.metrics,
                ),
            )
        elif outcome.breaches:
            store.update_state(rollout.rollout_id, "paused")
            store.append_event(
                rollout.rollout_id,
                policy.build_decision(
                    "PAUSE",
                    "Auto-pause: SLO breach",
                    ring_label,
                    outcome.metrics,
                ),
            )
        rollout = store.get_rollout(rollout.rollout_id)

    target_version = rollout.target_version if rollout else payload.sw_version
    return CheckinRes(
        rollout_id=rollout_id,
        apply={
            "target_version": target_version if payload.sw_version != target_version else None,
            "config_delta": None,
        },
        next_check_seconds=30,
        policy={"backoff": "exp-jitter", "max_retries": "5"},
    )
