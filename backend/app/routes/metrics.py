"""Metrics route returning current active ring health."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from .. import metrics as metrics_helpers
from .. import rings
from ..dependencies import get_store
from ..schemas import MetricsRes
from ..store import Store

router = APIRouter(prefix="/v1", tags=["metrics"])


@router.get("/metrics", response_model=MetricsRes)
def get_metrics(store: Store = Depends(get_store)) -> MetricsRes:
	rollout = store.active_rollout()
	if rollout is None:
		raise HTTPException(status_code=404, detail="No active rollout")

	ring_label = rings.ring_for(rollout.ring_index)
	window = store.metrics_for_ring(ring_label)
	return MetricsRes(
		active_rollout_id=rollout.rollout_id,
		active_ring=ring_label,
		window_seconds=metrics_helpers.WINDOW_SECONDS,
		boot_success=window.boot_success,
		crash_free_median=window.crash_free_median,
		checkin_ms_median=window.checkin_ms_median,
		breaches=window.breaches,
	)
