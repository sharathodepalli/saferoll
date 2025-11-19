"""Rolling-window metrics helpers for SafeRoll."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from statistics import median

from .schemas import Health

WINDOW_SECONDS = 300
BOOT_SUCCESS_GATE = 0.995
CRASH_FREE_GATE = 0.990
CHECKIN_MS_GATE = 500


@dataclass
class WindowMetrics:
	"""Computed statistics for a 5-minute window."""

	total: int
	boot_success: float
	crash_free_median: float
	checkin_ms_median: float
	breaches: list[str]

	def snapshot(self) -> dict[str, float]:
		"""Return the portion of the metrics captured inside a decision snapshot."""

		return {
			"boot_success": self.boot_success,
			"crash_free_median": self.crash_free_median,
			"checkin_ms_median": self.checkin_ms_median,
		}


def compute_window_metrics(events: Iterable[Health]) -> WindowMetrics:
	"""Compute SafeRoll SLO metrics over the provided events iterable."""

	events_list = list(events)
	total = len(events_list)
	if total == 0:
		return WindowMetrics(
			total=0,
			boot_success=1.0,
			crash_free_median=1.0,
			checkin_ms_median=0.0,
			breaches=[],
		)

	boot_success = sum(1 for event in events_list if event.boot_ok) / total
	crash_free_median = median(event.crash_free for event in events_list)
	checkin_ms_median = median(event.checkin_ms for event in events_list)

	breaches: list[str] = []
	if boot_success < BOOT_SUCCESS_GATE:
		breaches.append("boot_success_rate")
	if crash_free_median < CRASH_FREE_GATE:
		breaches.append("crash_free_median")
	if checkin_ms_median > CHECKIN_MS_GATE:
		breaches.append("checkin_ms_median")

	return WindowMetrics(
		total=total,
		boot_success=boot_success,
		crash_free_median=crash_free_median,
		checkin_ms_median=checkin_ms_median,
		breaches=breaches,
	)
