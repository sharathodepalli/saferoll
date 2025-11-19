"""Policy engine tests covering gateway scenarios."""

from datetime import UTC, datetime, timedelta

from app.policy import PolicyEngine
from app.schemas import CheckinReq, Health
from app.store import Store


def _record_samples(
    store: Store, ring: str, crash: float, boot_ok: bool = True, count: int = 10
) -> None:
    """Helper to push identical samples into the ring window."""

    for idx in range(count):
        payload = CheckinReq(
            device_id=f"device-{ring}-{idx}",
            ring=ring,  # type: ignore[arg-type]
            sw_version="1.2.0",
            health=Health(boot_ok=boot_ok, crash_free=crash, checkin_ms=100),
            ts=datetime.now(UTC).isoformat(),
        )
        store.record_checkin(payload)


def test_green_window_can_promote() -> None:
    store = Store()
    policy = PolicyEngine(store)
    rollout = store.create_rollout("1.2.0", "1.1.0")
    _record_samples(store, "pilot", crash=0.999)

    now = datetime.now(UTC)
    outcome = policy.evaluate_rollout(rollout.rollout_id, now=now)
    assert outcome.can_promote
    assert not outcome.breaches
    assert not outcome.auto_rollback


def test_crash_free_below_threshold_pauses() -> None:
    store = Store()
    policy = PolicyEngine(store)
    rollout = store.create_rollout("1.2.0", "1.1.0")
    _record_samples(store, "pilot", crash=0.985)

    now = datetime.now(UTC)
    outcome = policy.evaluate_rollout(rollout.rollout_id, now=now)
    assert not outcome.can_promote
    assert "crash_free_median" in outcome.breaches
    assert not outcome.auto_rollback


def test_auto_rollback_guard() -> None:
    store = Store()
    policy = PolicyEngine(store)
    rollout = store.create_rollout("1.2.0", "1.1.0")
    _record_samples(store, "pilot", crash=0.94)

    now = datetime.now(UTC)
    outcome = policy.evaluate_rollout(rollout.rollout_id, now=now)
    assert outcome.auto_rollback


def test_cooldown_blocks_double_promote() -> None:
    store = Store()
    policy = PolicyEngine(store)
    rollout = store.create_rollout("1.2.0", "1.1.0")
    _record_samples(store, "pilot", crash=0.999)

    now = datetime.now(UTC)
    rollout_state = store.get_rollout(rollout.rollout_id)
    rollout_state.last_promote_ts = now - timedelta(seconds=30)

    outcome = policy.evaluate_rollout(rollout.rollout_id, now=now)
    assert not outcome.can_promote
    assert not outcome.breaches
    assert not outcome.auto_rollback
