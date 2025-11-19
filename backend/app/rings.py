"""Ring constants and helpers for SafeRoll."""

from __future__ import annotations

from .schemas import Ring

RINGS: tuple[Ring, ...] = ("pilot", "five", "twentyfive", "all")
RING_TO_INDEX = {ring: idx for idx, ring in enumerate(RINGS)}


def index_for(ring: Ring) -> int:
    """Return the numeric index for the provided ring."""

    return RING_TO_INDEX[ring]


def ring_for(index: int) -> Ring:
    """Return the ring label for a given index, raising on invalid indexes."""

    if index < 0 or index >= len(RINGS):
        raise IndexError(f"Ring index {index} out of range")
    return RINGS[index]


def next_ring_index(current_index: int) -> int | None:
    """Return the index of the next ring or None if already at the end."""

    if current_index < 0 or current_index >= len(RINGS) - 1:
        return None
    return current_index + 1


def is_final_ring(index: int) -> bool:
    """Return True if the index points to the final rollout ring."""

    return index >= len(RINGS) - 1
