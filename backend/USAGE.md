# SafeRoll — Usage Guide

This document explains how to run and use the SafeRoll demo repository (backend, frontend, and simulator). It gathers the most common workflows, commands, and troubleshooting tips so you can run demos or tests locally.

## Quick overview

- Backend: FastAPI application in `app/` exposing `/v1/*` endpoints. Run with `uvicorn app.main:app --reload --port 8000`.
- Frontend: Vite + React single-page dashboard in `frontend/` that polls the backend for metrics and exposes Promote/Pause/Resume/Rollback controls.
- Simulator: Python CLI (Typer + httpx) in `simulator/` that spawns virtual devices and posts `/v1/checkin` events to the backend. Supports hot failure toggles via `sim_flags.json`.

## Prerequisites

- Python 3.10+ (a virtualenv is recommended). The repo includes a `.venv` for local dev in this workspace.
- Node.js + npm for the frontend.
- From the `backend` repo root, activate venv (if provided):

```bash
source .venv/bin/activate
```

## 1) Start the backend

From the backend root:

```bash
# start backend in a dedicated terminal
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Keep this terminal dedicated to the backend server log.

Verify health quickly from another terminal:

```bash
curl -s http://127.0.0.1:8000/v1/health
```

Note: `GET /v1/metrics` will return 404 until a rollout exists (see below).

## 2) Start the frontend (optional)

Open a new terminal, go to the `frontend` folder and run:

```bash
cd frontend
npm install
npm run dev
```

The dashboard defaults to `http://localhost:5173` and expects the backend at `http://localhost:8000`.

If the frontend console shows repeated `GET /v1/metrics 404`, it usually means no rollout exists yet on the backend.

## 3) Seed an initial rollout

Create a rollout so that `/v1/metrics` has context and the dashboard will show an active rollout.

```bash
curl -s -X POST http://localhost:8000/v1/rollouts \
  -H "Content-Type: application/json" \
  -d '{"target_version":"1.2.0","last_known_good":"1.1.5"}' | jq .
```

The response contains `rollout_id` (e.g. `r-....`) which the dashboard will use. If you restart the backend you must re-create a rollout (store is in-memory).

## 4) Run the simulator (in its own terminal)

Install the simulator package editable (from backend root):

```bash
# from backend root
.venv/bin/pip install -e ./simulator
```

Start the simulator to simulate device check-ins (run in its own terminal):

```bash
# run 500 devices posting every 5s
python -m simulator.cli run --api-url http://localhost:8000 --devices 500 --interval 5
```

Simulator hot commands (run from another terminal):

```bash
# show current flags (reads simulator/simulator/sim_flags.json)
python -m simulator.cli status

# inject a crash bias into the five ring (value between 0.0 and 0.2)
python -m simulator.cli inject five 0.08

# clear a ring or all rings
python -m simulator.cli clear five
python -m simulator.cli clear all
```

Simulator output explanation:

- `[sim] active=500 sent=3000 fail=0 | pilot:bias=0.000, five:bias=0.000, ...`
  - `active` = number of virtual devices
  - `sent` = cumulative successful POSTs
  - `fail` = failed check-ins
  - `bias` values reflect injected failure bias per ring

If you inject a bias (e.g. `inject five 0.08`) devices in that ring will report worse `crash_free` / `boot_ok` / latency metrics.

## 5) Dashboard controls & API mapping

Actions in the UI map to these endpoints (all under `/v1/rollouts/{rollout_id}`):

- Promote: `POST /promote` — advances to next ring if policy allows (SLOs + cooldown + active state)
- Pause: `POST /pause` — marks rollout state `paused`
- Resume: the UI re-issues a `POST /promote` (there is no dedicated resume endpoint in this implementation). Promote will only succeed when policy allows.
- Rollback: `POST /rollback` — revert to `last_known_good` and set state to `active` (rollout ring is moved back)

Important: `POST /promote` requires the rollout to be `active`, the SLO gates must be clear, and the promote cooldown (120s) must be satisfied. If any constraint fails, the API returns HTTP 400. Use `/should_promote` to see the reason.

## 6) Useful API endpoints

- `POST /v1/rollouts` — create a rollout
- `GET /v1/rollouts` — list rollouts
- `GET /v1/rollouts/{id}` — rollout detail and recent decisions
- `POST /v1/rollouts/{id}/promote` — promote
- `POST /v1/rollouts/{id}/pause` — pause
- `POST /v1/rollouts/{id}/rollback` — rollback
- `GET /v1/rollouts/{id}/should_promote` — advisory; returns decision, reason, metrics snapshot, breaches
- `POST /v1/checkin` — endpoint used by the simulator to post health check events
- `GET /v1/metrics` — active rollout metrics (returns 404 if no rollout)

## 7) Diagnosing issues and logs

If a promotion is blocked or the dashboard shows a pause/rollback, do the following:

1. Check the advisory decision to know the cause:

```bash
curl -s http://127.0.0.1:8000/v1/rollouts/<ROLLOUT_ID>/should_promote | jq .
```

`decision` will be one of `PROMOTE`, `PAUSE`, `ROLLBACK`, `ADVISE_NO`. `breaches` will list which gates failed (e.g. `crash_free_median`).

2. Inspect recent decisions:

```bash
curl -s http://127.0.0.1:8000/v1/rollouts/<ROLLOUT_ID> | jq .decisions
```

Each `Decision` includes a `snapshot` object with the exact metrics the policy evaluated at the time.

3. Backend logs (uvicorn terminal) show route activity and any exceptions. Keep the server terminal open to observe auto-pause/rollback events.

4. Simulator status: it prints every 10s the `sent`/`fail` counters and the `bias` values. If `fail` is non-zero, check connectivity or server errors.

## 8) Common workflows

A: Demo a successful rollout

1. Start backend and frontend.
2. `POST /v1/rollouts` to create rollout.
3. Start simulator: `python -m simulator.cli run --devices 500`
4. Wait for pilot metrics to stabilize. On the dashboard, when SLO tiles are green and `should_promote` returns `PROMOTE`, click Promote.
5. Repeat for five → twentyfive → all.

B: Demo an auto-pause/rollback

1. Start simulator.
2. Inject a bias into a ring: `python -m simulator.cli inject five 0.08`.
3. The backend will detect SLO breaches and automatically `PAUSE` the rollout (or `ROLLBACK` if critical thresholds are broken). The Recent Decisions panel will show the reason and the metrics snapshot.

## 9) Developer notes

- The store is in-memory (class `Store`), so state is lost when the server restarts. For persistent demos you can modify `app/store.py` to persist to a database.
- Policy logic lives in `app/policy.py`: gates and thresholds are defined here — adjust constants like `PROMOTE_COOLDOWN_SECONDS` if you want faster demos.
- The simulator uses `simulator/simulator/sim_flags.json` for hot reload. The Typer CLI exposes `inject`/`clear`/`status` to manipulate it.

## 10) Troubleshooting tips

- 404 on `/v1/metrics`: there is no active rollout. Create one (see step 3).
- `POST /promote` returns 400: run `/should_promote` to see which gate blocks promotion (cooldown, breaches, or paused state).
- Dashboard shows stale metrics: increase simulator device count or wait a couple of seconds for the 5-minute window to fill; metrics compute median across the recent window.

## 11) Want a resume endpoint?

The UI currently re-issues `POST /promote` as the "resume" action. If you prefer a dedicated resume API (that flips state to `active`), we can add `POST /v1/rollouts/{id}/resume` which would call `store.update_state(rollout_id, "active")`. Tell me and I can implement it.

---

If you'd like, I can also add a compact cheatsheet file (`simulator/README.md` already exists) or wire a `/v1/resume` endpoint. Tell me which you'd prefer next.
