# SafeRoll Simulator

Python-based device simulator that replays fleets into the SafeRoll backend. It is built with Typer + httpx and mirrors the rollout rings and health metrics described in the backend spec.

## Prerequisites

1. Activate the backend virtual environment:
   ```bash
   source .venv/bin/activate
   ```
2. Install the simulator package (editable for quick tweaks):
   ```bash
   pip install -e simulator
   ```
3. Ensure the FastAPI backend is running locally (for example via `make run-backend`).

## Running the simulator

From the backend repo root:

```bash
python -m simulator.cli run --api-url http://localhost:8000 --devices 1000 --interval 5
```

- `--devices` controls how many devices are spawned across the four rollout rings (pilot/five/twentyfive/all) using the documented ratios.
- `--interval` specifies how frequently each device posts `/v1/checkin` payloads (seconds).
- The simulator prints summary snapshots every 10 seconds showing active devices, sent/failed counts, and current failure bias per ring.

## Failure toggles (hot reload)

The simulator watches `simulator/simulator/sim_flags.json` for overrides, but you rarely need to edit the file manually because Typer commands manage it for you:

```bash
# show active biases
python -m simulator.cli status

# inject extra crash rate for a ring (value between 0.0 and 0.2)
python -m simulator.cli inject five 0.08

# clear one ring or all rings
python -m simulator.cli clear five
python -m simulator.cli clear all
```

When a flag is present, devices in that ring will report lower `crash_free` values, higher latency, and more boot failures until you clear the flag.

## Files of interest

- `simulator/simulator/cli.py` — Typer CLI entry point and async device loop.
- `simulator/simulator/sim_flags.json` — hot-reloadable failure biases watched by the simulator.

## Troubleshooting

- If Typer commands are unavailable, reinstall the package (`pip install -e simulator`).
- Use `python -m simulator.cli status` to verify the simulator sees the latest flags.
- Run with fewer devices during local testing (e.g., `--devices 200`) if you want to keep backend spam low.
