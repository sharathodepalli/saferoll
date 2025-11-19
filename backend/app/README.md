# SafeRoll Backend

FastAPI service implementing SafeRoll's SLO-gated rollout guard. This backend exposes device check-in, rollout controls, and metrics endpoints according to `PROMPT 1 — Backend (FastAPI).txt`.

## Run

```bash
make run-backend
```

This starts Uvicorn on http://localhost:8000 with CORS open to http://localhost:5173.

## Sample requests

```bash
# Create a rollout
curl -X POST http://localhost:8000/v1/rollouts \
  -H 'Content-Type: application/json' \
  -d '{"target_version":"1.2.0","last_known_good":"1.1.0"}'

# Device check-in
curl -X POST http://localhost:8000/v1/checkin \
  -H 'Content-Type: application/json' \
  -d '{
        "device_id":"tv-1",
        "ring":"pilot",
        "sw_version":"1.1.0",
        "health":{"boot_ok":true,"crash_free":0.999,"checkin_ms":42},
        "ts":"2025-11-18T10:30:00Z"
      }'

# Metrics for the active rollout ring
curl http://localhost:8000/v1/metrics

# Promote rollout when SLO gates pass
curl -X POST http://localhost:8000/v1/rollouts/<rollout_id>/promote
```

## Assumptions

- Time handling uses UTC and accepts ISO 8601 timestamps with optional `Z` suffix.
- Cooldown between promotions is fixed at 120 seconds per SafeRoll spec.
- Auto-rollback resets the ring index to the previous ring and keeps the rollout `state="active"`.
- Simulator posts every 5 seconds and expects lightweight `CheckinRes` payloads; apply directives currently cover only `target_version` updates.

```

```
