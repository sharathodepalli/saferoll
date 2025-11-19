# SafeRoll Frontend

A single-page React (Vite + TypeScript + Tailwind) dashboard for monitoring and driving the SafeRoll backend hosted on `http://localhost:8000`.

## Features

- 2s polling of `/v1/metrics` and `/v1/rollouts/{id}` using React Query.
- Ring cards showing the four rollout rings (Pilot → All) with health indicators.
- Manual controls for Promote, Pause, Resume (re-issues Promote), and Rollback actions plus cooldown awareness.
- Metrics panel with SLO pass/fail labels and a recent decision log.
- Toast notifications and graceful handling of backend errors/offline state.

## Available Scripts

```bash
npm install
npm run dev      # starts Vite dev server on http://localhost:5173
npm run build    # generates production bundle
npm run preview  # serves the production bundle locally
```

## Notes

- `Resume` reuses the backend's `POST /v1/rollouts/{id}/promote` endpoint because the API does not expose a dedicated unpause route. Paused rollouts can resume only when the backend accepts another promotion.
- Cooldown timers are inferred from the most recent `PROMOTE` decision with the documented 120-second policy gate.
- Update `VITE_API_BASE` in a `.env` file if the backend runs on a different origin.
