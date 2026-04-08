from __future__ import annotations

import copy
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data import LOCATIONS, ROUTES, USD_RATE
from models import (
    LegUpdate,
    Location,
    LocationCreate,
    OptimizationRequest,
    OptimizationResponse,
    Route,
)
from optimizer import get_optimizer
from tracking import get_tracking, start_tracking, tick

app = FastAPI(title="Grain Route Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Locations ──────────────────────────────────────────────

@app.get("/api/locations", response_model=list[Location])
async def list_locations():
    return LOCATIONS


@app.post("/api/locations", response_model=Location)
async def create_location(body: LocationCreate):
    loc = Location(id=str(uuid.uuid4())[:8], **body.model_dump())
    LOCATIONS.append(loc)
    return loc


@app.delete("/api/locations/{location_id}")
async def delete_location(location_id: str):
    for i, loc in enumerate(LOCATIONS):
        if loc.id == location_id:
            LOCATIONS.pop(i)
            return {"ok": True}
    raise HTTPException(404, "Location not found")


# ── Routes & Legs ──────────────────────────────────────────

@app.get("/api/routes", response_model=list[Route])
async def list_routes():
    return ROUTES


@app.get("/api/routes/{route_id}", response_model=Route)
async def get_route(route_id: str):
    route = next((r for r in ROUTES if r.id == route_id), None)
    if not route:
        raise HTTPException(404, "Route not found")
    return route


@app.patch("/api/routes/{route_id}/legs/{leg_id}")
async def update_leg(route_id: str, leg_id: str, body: LegUpdate):
    route = next((r for r in ROUTES if r.id == route_id), None)
    if not route:
        raise HTTPException(404, "Route not found")
    leg = next((l for l in route.legs if l.id == leg_id), None)
    if not leg:
        raise HTTPException(404, "Leg not found")

    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(leg, key, value)
    return leg


# ── Optimization ───────────────────────────────────────────

@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize(request: OptimizationRequest):
    optimizer = get_optimizer()
    return optimizer.optimize(request, ROUTES)


# ── Tracking ───────────────────────────────────────────────

@app.post("/api/tracking/start")
async def tracking_start(route_id: str, deadline_days: int):
    try:
        state = start_tracking(route_id, deadline_days)
        return state
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/tracking/{shipment_id}/tick")
async def tracking_tick(shipment_id: str):
    try:
        return tick(shipment_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@app.get("/api/tracking/{shipment_id}")
async def tracking_get(shipment_id: str):
    try:
        return get_tracking(shipment_id)
    except KeyError:
        raise HTTPException(404, "Shipment not found")


# ── Meta ───────────────────────────────────────────────────

@app.get("/api/usd-rate")
async def get_usd_rate():
    return {"rate": USD_RATE}
