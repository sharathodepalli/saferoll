from __future__ import annotations

import asyncio
import json
import random
import signal
from contextlib import suppress
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import httpx
import typer

APP = typer.Typer(add_completion=False, help="SafeRoll device simulator")
DEFAULT_API = "http://localhost:8000"
DEFAULT_INTERVAL = 5.0
DEFAULT_DEVICES = 1000
FLAGS_PATH = Path(__file__).with_name("sim_flags.json")

RINGS: Dict[str, float] = {
    "pilot": 0.10,
    "five": 0.05,
    "twentyfive": 0.25,
    "all": 0.60,
}


@dataclass(slots=True)
class Device:
    device_id: str
    ring: str
    sw_version: str

    async def check_in(
        self,
        client: httpx.AsyncClient,
        api_base: str,
        health: "HealthProfile",
    ) -> None:
        payload = health.generate_payload(self)
        url = f"{api_base}/v1/checkin"
        await client.post(url, json=payload, timeout=10)


@dataclass(slots=True)
class HealthProfile:
    base_latency: int
    failure_bias: float = 0.0

    def generate_payload(self, device: Device) -> Dict[str, object]:
        crash_noisy = random.uniform(-0.01, 0.01)
        crash_free = max(0.0, min(1.0, 0.99 - self.failure_bias + crash_noisy))
        boot_failure_chance = 0.001 + (self.failure_bias * 5)
        boot_ok = random.random() > boot_failure_chance
        latency = int(
            self.base_latency
            * random.uniform(0.8, 1.2)
            * (1 + self.failure_bias * random.uniform(0.5, 2.0))
        )

        return {
            "device_id": device.device_id,
            "ring": device.ring,
            "sw_version": device.sw_version,
            "health": {
                "boot_ok": boot_ok,
                "crash_free": round(crash_free, 3),
                "checkin_ms": latency,
            },
            "ts": datetime.now(timezone.utc).isoformat(),
        }


class Simulator:
    def __init__(
        self,
        api_base: str = DEFAULT_API,
        devices: int = DEFAULT_DEVICES,
        interval: float = DEFAULT_INTERVAL,
    ) -> None:
        self.api_base = api_base.rstrip("/")
        self.interval = interval
        self.devices = self._spawn_devices(devices)
        self.health_profiles = self._build_health_profiles()
        self._stop = asyncio.Event()
        self._summary_task: asyncio.Task | None = None
        self._sent = 0
        self._failed = 0

    def _spawn_devices(self, count: int) -> List[Device]:
        devices: List[Device] = []
        for ring, ratio in RINGS.items():
            ring_count = max(1, int(count * ratio))
            for idx in range(ring_count):
                devices.append(
                    Device(
                        device_id=f"{ring}-{idx:04d}",
                        ring=ring,
                        sw_version="1.2.0",
                    )
                )
        return devices

    def _build_health_profiles(self) -> Dict[str, HealthProfile]:
        return {ring: HealthProfile(base_latency=50 if ring != "all" else 70) for ring in RINGS}

    def _load_flags(self) -> Dict[str, float]:
        if not FLAGS_PATH.exists():
            FLAGS_PATH.write_text("{}", encoding="utf-8")
            return {}
        try:
            with FLAGS_PATH.open("r", encoding="utf-8") as fp:
                data = json.load(fp)
            return {k: float(v) for k, v in data.items()}
        except (json.JSONDecodeError, OSError, ValueError):
            return {}

    async def _summary_loop(self) -> None:
        while not self._stop.is_set():
            failures = self._load_flags()
            msg = ", ".join(
                f"{ring}:bias={failures.get(ring, 0.0):.3f}"
                for ring in RINGS
            )
            typer.echo(
                f"[sim] active={len(self.devices)} sent={self._sent} fail={self._failed} | {msg}"
            )
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=10)
            except asyncio.TimeoutError:
                continue

    async def run(self) -> None:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._stop.set)

        async with httpx.AsyncClient() as client:
            self._summary_task = asyncio.create_task(self._summary_loop())
            while not self._stop.is_set():
                flags = self._load_flags()
                batch = []
                for device in self.devices:
                    profile = self.health_profiles[device.ring]
                    profile.failure_bias = flags.get(device.ring, 0.0)
                    batch.append(device.check_in(client, self.api_base, profile))
                results = await asyncio.gather(*batch, return_exceptions=True)
                for item in results:
                    if isinstance(item, Exception):
                        self._failed += 1
                    else:
                        self._sent += 1
                try:
                    await asyncio.wait_for(self._stop.wait(), timeout=self.interval)
                except asyncio.TimeoutError:
                    continue
        if self._summary_task:
            self._summary_task.cancel()
            with suppress(asyncio.CancelledError):
                await self._summary_task


def _write_flags(flags: Dict[str, float]) -> None:
    FLAGS_PATH.write_text(json.dumps(flags, indent=2), encoding="utf-8")


def _read_flags() -> Dict[str, float]:
    if not FLAGS_PATH.exists():
        return {}
    try:
        return json.loads(FLAGS_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


@APP.command()
def run(
    api_url: str = typer.Option(DEFAULT_API, "--api-url", help="SafeRoll backend base URL"),
    devices: int = typer.Option(DEFAULT_DEVICES, "--devices", help="Number of devices"),
    interval: float = typer.Option(DEFAULT_INTERVAL, "--interval", help="Seconds between check-ins"),
) -> None:
    """Run the SafeRoll device simulator."""

    simulator = Simulator(api_base=api_url, devices=devices, interval=interval)
    asyncio.run(simulator.run())


@APP.command()
def inject(
    ring: str = typer.Argument(..., help="Ring to degrade", metavar="[pilot|five|twentyfive|all]"),
    crash_rate: float = typer.Argument(..., help="Additional crash rate 0.0-0.2"),
) -> None:
    """Inject a failure bias for a ring (hot-reloaded by the simulator)."""

    ring = ring.lower()
    if ring not in RINGS:
        raise typer.BadParameter(f"Unknown ring '{ring}'. Choose from {', '.join(RINGS)}")
    if crash_rate < 0 or crash_rate > 0.2:
        raise typer.BadParameter("crash_rate must be between 0.0 and 0.2")
    flags = _read_flags()
    flags[ring] = crash_rate
    _write_flags(flags)
    typer.echo(f"Set {ring} crash bias to {crash_rate:.3f}")


@APP.command()
def clear(ring: str = typer.Argument("all", help="Ring to clear or 'all'")) -> None:
    """Clear failure bias for a ring or all rings."""

    flags = _read_flags()
    if ring == "all":
        flags.clear()
    else:
        ring = ring.lower()
        if ring not in RINGS:
            raise typer.BadParameter(f"Unknown ring '{ring}'")
        flags.pop(ring, None)
    _write_flags(flags)
    typer.echo("Failure biases cleared")


@APP.command()
def status() -> None:
    """Show current failure flags."""

    flags = _read_flags()
    if not flags:
        typer.echo("No failure biases active")
        return
    for ring, bias in flags.items():
        typer.echo(f"{ring}: {bias:.3f}")


def app() -> None:
    APP()


if __name__ == "__main__":
    app()
