from __future__ import annotations

from enum import Enum
from pydantic import BaseModel


class PointType(str, Enum):
    CITY = "city"
    PORT = "port"


class TransportType(str, Enum):
    RAIL = "rail"
    TRUCK = "truck"
    SEA = "sea"
    PORT_SERVICES = "port_services"
    TRANSIT = "transit"
    FEEDER = "feeder"


class CurrencyType(str, Enum):
    RUB = "RUB"
    USD = "USD"


class Priority(str, Enum):
    MIN_COST = "min_cost"
    MIN_TIME = "min_time"
    BALANCED = "balanced"


class Location(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    point_type: PointType
    country: str


class RouteLeg(BaseModel):
    id: str
    route_id: str
    transport_type: TransportType
    label: str
    origin: str
    destination: str
    distance_km: float
    cost_per_ton: float
    currency: CurrencyType
    duration_days: int
    cost_min: float
    cost_max: float
    duration_min: int
    duration_max: int


class Route(BaseModel):
    id: str
    name: str
    origin_id: str
    destination_id: str
    legs: list[RouteLeg]


class OptimizationRequest(BaseModel):
    origin_id: str
    destination_id: str
    deadline: str  # ISO date
    current_date: str  # ISO date
    priority: Priority = Priority.BALANCED
    max_deadline_deviation_days: int = 0
    max_cost_per_ton: float | None = None
    time_buffer_days: int = 0
    use_seasonal_coefficients: bool = False


class LegResult(BaseModel):
    label: str
    transport_type: TransportType
    origin: str
    destination: str
    distance_km: float
    cost_per_ton: float
    currency: CurrencyType
    duration_days: int


class RouteResult(BaseModel):
    route_id: str
    route_name: str
    legs: list[LegResult]
    total_cost_rub: float
    total_cost_usd: float
    total_duration_days: int
    duration_min: int
    duration_max: int
    deadline_deviation_days: int
    savings_vs_cheapest: float
    score: float
    criterion: str


class OptimizationResponse(BaseModel):
    routes: list[RouteResult]
    usd_rate: float


class TrackingState(BaseModel):
    shipment_id: str
    route_id: str
    current_leg_index: int
    day_in_leg: int
    total_elapsed_days: int
    status: str
    delay_days: int
    history: list[dict]


class LocationCreate(BaseModel):
    name: str
    lat: float
    lng: float
    point_type: PointType
    country: str


class LegUpdate(BaseModel):
    cost_per_ton: float | None = None
    cost_min: float | None = None
    cost_max: float | None = None
    duration_days: int | None = None
    duration_min: int | None = None
    duration_max: int | None = None
    currency: CurrencyType | None = None
