"""Integration tests for FastAPI routes."""

from __future__ import annotations

from collections.abc import Generator
from contextlib import contextmanager
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.dependencies import get_policy, get_store
from app.main import app
from app.policy import PolicyEngine
from app.schemas import CheckinReq, Health
from app.store import Store


@contextmanager
def build_client() -> Generator[tuple[TestClient, Store], None, None]:
    store = Store()
    policy = PolicyEngine(store)
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_policy] = lambda: policy
    client = TestClient(app)
    try:
        yield client, store
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_create_and_list_rollouts() -> None:
    with build_client() as (client, _):
        resp = client.post(
            "/v1/rollouts",
            json={"target_version": "1.2.0", "last_known_good": "1.1.0"},
        )
        assert resp.status_code == 200
        rollout_id = resp.json()["rollout_id"]

        list_resp = client.get("/v1/rollouts")
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert len(data) == 1
        assert data[0]["rollout_id"] == rollout_id


def test_checkin_auto_pause_on_breach() -> None:
    with build_client() as (client, store):
        rollout_id = client.post(
            "/v1/rollouts",
            json={"target_version": "1.2.0", "last_known_good": "1.1.0"},
        ).json()["rollout_id"]

        payload = {
            "device_id": "tv-1",
            "ring": "pilot",
            "sw_version": "1.2.0",
            "health": {"boot_ok": True, "crash_free": 0.98, "checkin_ms": 600},
            "ts": datetime.now(UTC).isoformat(),
        }
        resp = client.post("/v1/checkin", json=payload)
        assert resp.status_code == 200

        rollout = store.get_rollout(rollout_id)
        assert rollout.state == "paused"
        decisions = store.rollout_decisions(rollout_id)
        assert decisions[-1].kind == "PAUSE"


def test_metrics_endpoint_reports_window() -> None:
    with build_client() as (client, store):
        client.post(
            "/v1/rollouts",
            json={"target_version": "1.2.0", "last_known_good": "1.1.0"},
        )

        checkin = CheckinReq(
            device_id="tv-1",
            ring="pilot",  # type: ignore[arg-type]
            sw_version="1.2.0",
            health=Health(boot_ok=True, crash_free=0.999, checkin_ms=40),
            ts=datetime.now(UTC).isoformat(),
        )
        store.record_checkin(checkin)

        resp = client.get("/v1/metrics")
        assert resp.status_code == 200
        payload = resp.json()
        assert payload["active_ring"] == "pilot"
        assert payload["boot_success"] == 1.0


def test_should_promote_advisory_logged() -> None:
    with build_client() as (client, store):
        rollout_id = client.post(
            "/v1/rollouts",
            json={"target_version": "1.2.0", "last_known_good": "1.1.0"},
        ).json()["rollout_id"]
        _ = client.get(f"/v1/rollouts/{rollout_id}/should_promote")
        assert store.events, "Advisory decisions should populate store events"

        decision = store.events[-1]
        assert decision.kind in {"PROMOTE", "PAUSE", "ROLLBACK", "ADVISE_NO"}