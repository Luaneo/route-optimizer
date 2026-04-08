"""Shipment tracking simulation.

1 second = 1 day of real time.
Warns when <= 3 days to deadline.
Suggests alternative route on delay > 2 days on any leg.
"""

from __future__ import annotations

import random
import uuid

from data import ROUTES
from models import TrackingState


_shipments: dict[str, dict] = {}


def start_tracking(route_id: str, deadline_days: int) -> TrackingState:
    route = next((r for r in ROUTES if r.id == route_id), None)
    if route is None:
        raise ValueError(f"Route {route_id} not found")

    shipment_id = str(uuid.uuid4())[:8]
    _shipments[shipment_id] = {
        "route_id": route_id,
        "deadline_days": deadline_days,
        "current_leg_index": 0,
        "day_in_leg": 0,
        "total_elapsed_days": 0,
        "delay_days": 0,
        "history": [{"day": 0, "event": f"Отправка из {route.legs[0].origin}", "location": route.legs[0].origin}],
    }

    return _get_state(shipment_id)


def tick(shipment_id: str) -> TrackingState:
    """Advance simulation by 1 day."""
    s = _shipments.get(shipment_id)
    if s is None:
        raise ValueError(f"Shipment {shipment_id} not found")

    route = next(r for r in ROUTES if r.id == s["route_id"])
    leg = route.legs[s["current_leg_index"]]

    s["total_elapsed_days"] += 1
    s["day_in_leg"] += 1

    # Random delay chance (10%)
    if random.random() < 0.1:
        s["delay_days"] += 1
        s["history"].append({
            "day": s["total_elapsed_days"],
            "event": f"Задержка на этапе: {leg.label}",
            "location": leg.origin if s["day_in_leg"] < leg.duration_days // 2 else leg.destination,
        })

    # Check if current leg is complete
    if s["day_in_leg"] >= leg.duration_days:
        s["history"].append({
            "day": s["total_elapsed_days"],
            "event": f"Завершён этап: {leg.label} → прибытие в {leg.destination}",
            "location": leg.destination,
        })
        s["current_leg_index"] += 1
        s["day_in_leg"] = 0

        if s["current_leg_index"] >= len(route.legs):
            s["history"].append({
                "day": s["total_elapsed_days"],
                "event": "Груз доставлен!",
                "location": route.legs[-1].destination,
            })

    return _get_state(shipment_id)


def get_tracking(shipment_id: str) -> TrackingState:
    return _get_state(shipment_id)


def _get_state(shipment_id: str) -> TrackingState:
    s = _shipments[shipment_id]
    route = next(r for r in ROUTES if r.id == s["route_id"])
    completed = s["current_leg_index"] >= len(route.legs)
    remaining = s["deadline_days"] - s["total_elapsed_days"]

    if completed:
        status = "delivered"
    elif remaining <= 0:
        status = "overdue"
    elif remaining <= 3:
        status = "warning"
    elif s["delay_days"] > 2:
        status = "delay_alert"
    else:
        status = "in_transit"

    return TrackingState(
        shipment_id=shipment_id,
        route_id=s["route_id"],
        current_leg_index=s["current_leg_index"],
        day_in_leg=s["day_in_leg"],
        total_elapsed_days=s["total_elapsed_days"],
        status=status,
        delay_days=s["delay_days"],
        history=s["history"],
    )
