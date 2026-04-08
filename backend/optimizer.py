"""Route optimization engine with pluggable strategy pattern.

To substitute the model, implement a new class inheriting from BaseOptimizer
and override the `optimize` method.
"""

from __future__ import annotations

import abc
from datetime import date, timedelta

from data import ROUTES, USD_RATE
from models import (
    CurrencyType,
    LegResult,
    OptimizationRequest,
    OptimizationResponse,
    Priority,
    Route,
    RouteResult,
)


class BaseOptimizer(abc.ABC):
    """Abstract base for optimization strategies."""

    @abc.abstractmethod
    def optimize(self, request: OptimizationRequest, routes: list[Route]) -> OptimizationResponse:
        ...


class EnumerationOptimizer(BaseOptimizer):
    """Enumerate all routes, score each, return top results by three criteria."""

    def __init__(self, usd_rate: float = USD_RATE):
        self.usd_rate = usd_rate

    def _cost_in_rub(self, cost: float, currency: CurrencyType) -> float:
        if currency == CurrencyType.USD:
            return cost * self.usd_rate
        return cost

    def _evaluate_route(self, route: Route) -> tuple[float, float, int, int, int]:
        """Return (total_rub, total_usd, duration, dur_min, dur_max) for a route."""
        total_rub = 0.0
        total_usd = 0.0
        total_days = 0
        dur_min = 0
        dur_max = 0
        for leg in route.legs:
            if leg.currency == CurrencyType.RUB:
                total_rub += leg.cost_per_ton
            else:
                total_usd += leg.cost_per_ton
            total_days += leg.duration_days
            dur_min += leg.duration_min
            dur_max += leg.duration_max
        return total_rub, total_usd, total_days, dur_min, dur_max

    def optimize(self, request: OptimizationRequest, routes: list[Route] | None = None) -> OptimizationResponse:
        if routes is None:
            routes = ROUTES

        # Filter routes matching origin/destination
        candidates = [
            r for r in routes
            if r.origin_id == request.origin_id and r.destination_id == request.destination_id
        ]

        deadline = date.fromisoformat(request.deadline)
        current = date.fromisoformat(request.current_date)
        available_days = (deadline - current).days

        evaluated: list[RouteResult] = []
        for route in candidates:
            total_rub, total_usd, duration, dur_min, dur_max = self._evaluate_route(route)
            total_cost_rub = total_rub + total_usd * self.usd_rate
            deviation = max(0, duration - available_days)

            legs = [
                LegResult(
                    label=leg.label,
                    transport_type=leg.transport_type,
                    origin=leg.origin,
                    destination=leg.destination,
                    distance_km=leg.distance_km,
                    cost_per_ton=leg.cost_per_ton,
                    currency=leg.currency,
                    duration_days=leg.duration_days,
                )
                for leg in route.legs
            ]

            evaluated.append(RouteResult(
                route_id=route.id,
                route_name=route.name,
                legs=legs,
                total_cost_rub=round(total_cost_rub, 2),
                total_cost_usd=round(total_usd, 2),
                total_duration_days=duration,
                duration_min=dur_min,
                duration_max=dur_max,
                deadline_deviation_days=deviation,
                savings_vs_cheapest=0,
                score=0,
                criterion="",
            ))

        if not evaluated:
            return OptimizationResponse(routes=[], usd_rate=self.usd_rate)

        # Find cheapest for savings calculation
        cheapest_cost = min(r.total_cost_rub for r in evaluated)
        for r in evaluated:
            r.savings_vs_cheapest = round(r.total_cost_rub - cheapest_cost, 2)

        # Build results by three criteria
        results: list[RouteResult] = []

        # Criterion 1: Min cost, subject to deadline + deviation
        max_duration = available_days + request.max_deadline_deviation_days + request.time_buffer_days
        cost_feasible = [r for r in evaluated if r.total_duration_days <= max_duration]
        if cost_feasible:
            best_cost = min(cost_feasible, key=lambda r: r.total_cost_rub)
            best_cost.criterion = "min_cost"
            best_cost.score = round(best_cost.total_cost_rub, 2)
            results.append(best_cost)

        # Criterion 2: Min time, subject to max cost
        if request.max_cost_per_ton is not None:
            time_feasible = [r for r in evaluated if r.total_cost_rub <= request.max_cost_per_ton]
        else:
            time_feasible = list(evaluated)
        if time_feasible:
            best_time = min(time_feasible, key=lambda r: r.total_duration_days)
            if best_time.route_id not in {r.route_id for r in results}:
                best_time.criterion = "min_time"
                best_time.score = float(best_time.total_duration_days)
                results.append(best_time)

        # Criterion 3: Balanced (normalize cost and time, weighted sum)
        costs = [r.total_cost_rub for r in evaluated]
        durations = [r.total_duration_days for r in evaluated]
        cost_range = max(costs) - min(costs) if max(costs) != min(costs) else 1
        dur_range = max(durations) - min(durations) if max(durations) != min(durations) else 1

        for r in evaluated:
            norm_cost = (r.total_cost_rub - min(costs)) / cost_range
            norm_dur = (r.total_duration_days - min(durations)) / dur_range
            r.score = round(0.5 * norm_cost + 0.5 * norm_dur, 4)

        balanced_candidates = [r for r in evaluated if r.route_id not in {x.route_id for x in results}]
        if balanced_candidates:
            best_balanced = min(balanced_candidates, key=lambda r: r.score)
            best_balanced.criterion = "balanced"
            results.append(best_balanced)

        # If we still have fewer than 3, fill from remaining
        remaining = [r for r in evaluated if r.route_id not in {x.route_id for x in results}]
        remaining.sort(key=lambda r: r.score)
        for r in remaining:
            if len(results) >= 3:
                break
            r.criterion = "alternative"
            results.append(r)

        # If priorities given, sort accordingly
        if request.priority == Priority.MIN_COST:
            results.sort(key=lambda r: r.total_cost_rub)
        elif request.priority == Priority.MIN_TIME:
            results.sort(key=lambda r: r.total_duration_days)
        else:
            results.sort(key=lambda r: r.score)

        return OptimizationResponse(routes=results, usd_rate=self.usd_rate)


# Default optimizer instance — swap this to change the strategy
_optimizer: BaseOptimizer = EnumerationOptimizer()


def get_optimizer() -> BaseOptimizer:
    return _optimizer


def set_optimizer(optimizer: BaseOptimizer) -> None:
    global _optimizer
    _optimizer = optimizer
