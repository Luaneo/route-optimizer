/**
 * Mock API implementation — runs entirely on-device, no server needed.
 * Used for Expo mobile testing without backend connection.
 */
import type {
  ApiService, LegUpdate, Location, LocationCreate,
  OptimizationRequest, OptimizationResponse, Route,
  RouteLeg, RouteResult, TrackingState,
} from './types';
import { MOCK_LOCATIONS, MOCK_ROUTES, USD_RATE } from './mock-data';

let locations = [...MOCK_LOCATIONS];
let routes = [...MOCK_ROUTES];

const shipments: Record<string, {
  route_id: string;
  deadline_days: number;
  current_leg_index: number;
  day_in_leg: number;
  total_elapsed_days: number;
  delay_days: number;
  history: { day: number; event: string; location: string }[];
}> = {};

function costInRub(cost: number, currency: string): number {
  return currency === 'USD' ? cost * USD_RATE : cost;
}

function runOptimizer(req: OptimizationRequest): OptimizationResponse {
  const candidates = routes.filter(
    r => r.origin_id === req.origin_id && r.destination_id === req.destination_id
  );

  const availableDays =
    (new Date(req.deadline).getTime() - new Date(req.current_date).getTime()) / (1000 * 60 * 60 * 24);

  const evaluated: RouteResult[] = candidates.map(route => {
    let totalRub = 0, totalUsd = 0, duration = 0, durMin = 0, durMax = 0;
    for (const leg of route.legs) {
      if (leg.currency === 'RUB') totalRub += leg.cost_per_ton;
      else totalUsd += leg.cost_per_ton;
      duration += leg.duration_days;
      durMin += leg.duration_min;
      durMax += leg.duration_max;
    }
    const totalCostRub = totalRub + totalUsd * USD_RATE;
    const deviation = Math.max(0, duration - availableDays);

    return {
      route_id: route.id,
      route_name: route.name,
      legs: route.legs.map(l => ({
        label: l.label, transport_type: l.transport_type,
        origin: l.origin, destination: l.destination,
        distance_km: l.distance_km, cost_per_ton: l.cost_per_ton,
        currency: l.currency, duration_days: l.duration_days,
      })),
      total_cost_rub: Math.round(totalCostRub * 100) / 100,
      total_cost_usd: Math.round(totalUsd * 100) / 100,
      total_duration_days: duration,
      duration_min: durMin,
      duration_max: durMax,
      deadline_deviation_days: deviation,
      savings_vs_cheapest: 0,
      score: 0,
      criterion: '',
    };
  });

  if (evaluated.length === 0) return { routes: [], usd_rate: USD_RATE };

  const cheapest = Math.min(...evaluated.map(r => r.total_cost_rub));
  evaluated.forEach(r => { r.savings_vs_cheapest = Math.round((r.total_cost_rub - cheapest) * 100) / 100; });

  const results: RouteResult[] = [];
  const used = new Set<string>();

  // Min cost
  const maxDur = availableDays + req.max_deadline_deviation_days + req.time_buffer_days;
  const costFeasible = evaluated.filter(r => r.total_duration_days <= maxDur);
  if (costFeasible.length > 0) {
    const best = costFeasible.reduce((a, b) => a.total_cost_rub < b.total_cost_rub ? a : b);
    best.criterion = 'min_cost';
    results.push(best);
    used.add(best.route_id);
  }

  // Min time
  const timeFeasible = req.max_cost_per_ton != null
    ? evaluated.filter(r => r.total_cost_rub <= req.max_cost_per_ton!)
    : [...evaluated];
  if (timeFeasible.length > 0) {
    const best = timeFeasible.reduce((a, b) => a.total_duration_days < b.total_duration_days ? a : b);
    if (!used.has(best.route_id)) {
      best.criterion = 'min_time';
      results.push(best);
      used.add(best.route_id);
    }
  }

  // Balanced
  const costs = evaluated.map(r => r.total_cost_rub);
  const durs = evaluated.map(r => r.total_duration_days);
  const costRange = Math.max(...costs) - Math.min(...costs) || 1;
  const durRange = Math.max(...durs) - Math.min(...durs) || 1;
  evaluated.forEach(r => {
    const nc = (r.total_cost_rub - Math.min(...costs)) / costRange;
    const nd = (r.total_duration_days - Math.min(...durs)) / durRange;
    r.score = Math.round((0.5 * nc + 0.5 * nd) * 10000) / 10000;
  });

  const remaining = evaluated.filter(r => !used.has(r.route_id)).sort((a, b) => a.score - b.score);
  if (remaining.length > 0) {
    remaining[0].criterion = 'balanced';
    results.push(remaining[0]);
    used.add(remaining[0].route_id);
  }

  // Fill to at least 3
  const rest = evaluated.filter(r => !used.has(r.route_id)).sort((a, b) => a.score - b.score);
  for (const r of rest) {
    if (results.length >= 3) break;
    r.criterion = 'alternative';
    results.push(r);
  }

  if (req.priority === 'min_cost') results.sort((a, b) => a.total_cost_rub - b.total_cost_rub);
  else if (req.priority === 'min_time') results.sort((a, b) => a.total_duration_days - b.total_duration_days);
  else results.sort((a, b) => a.score - b.score);

  return { routes: results, usd_rate: USD_RATE };
}

export const mockApi: ApiService = {
  async getLocations() { return [...locations]; },

  async createLocation(data: LocationCreate) {
    const loc: Location = { id: Math.random().toString(36).slice(2, 10), ...data };
    locations.push(loc);
    return loc;
  },

  async deleteLocation(id: string) {
    locations = locations.filter(l => l.id !== id);
  },

  async getRoutes() { return [...routes]; },

  async getRoute(id: string) {
    const r = routes.find(r => r.id === id);
    if (!r) throw new Error('Route not found');
    return r;
  },

  async updateLeg(routeId: string, legId: string, data: LegUpdate) {
    const route = routes.find(r => r.id === routeId);
    if (!route) throw new Error('Route not found');
    const leg = route.legs.find(l => l.id === legId);
    if (!leg) throw new Error('Leg not found');
    Object.assign(leg, data);
    return leg;
  },

  async optimize(request: OptimizationRequest) {
    return runOptimizer(request);
  },

  async startTracking(routeId: string, deadlineDays: number) {
    const route = routes.find(r => r.id === routeId);
    if (!route) throw new Error('Route not found');
    const id = Math.random().toString(36).slice(2, 10);
    shipments[id] = {
      route_id: routeId, deadline_days: deadlineDays,
      current_leg_index: 0, day_in_leg: 0, total_elapsed_days: 0,
      delay_days: 0,
      history: [{ day: 0, event: `Отправка из ${route.legs[0].origin}`, location: route.legs[0].origin }],
    };
    return getState(id);
  },

  async tickTracking(shipmentId: string) {
    const s = shipments[shipmentId];
    if (!s) throw new Error('Shipment not found');
    const route = routes.find(r => r.id === s.route_id)!;
    const leg = route.legs[s.current_leg_index];

    s.total_elapsed_days++;
    s.day_in_leg++;

    if (Math.random() < 0.1) {
      s.delay_days++;
      s.history.push({ day: s.total_elapsed_days, event: `Задержка на этапе: ${leg.label}`, location: leg.origin });
    }

    if (s.day_in_leg >= leg.duration_days) {
      s.history.push({ day: s.total_elapsed_days, event: `Завершён этап: ${leg.label} → прибытие в ${leg.destination}`, location: leg.destination });
      s.current_leg_index++;
      s.day_in_leg = 0;
      if (s.current_leg_index >= route.legs.length) {
        s.history.push({ day: s.total_elapsed_days, event: 'Груз доставлен!', location: route.legs[route.legs.length - 1].destination });
      }
    }

    return getState(shipmentId);
  },

  async getTracking(shipmentId: string) {
    return getState(shipmentId);
  },
};

function getState(id: string): TrackingState {
  const s = shipments[id];
  const route = routes.find(r => r.id === s.route_id)!;
  const completed = s.current_leg_index >= route.legs.length;
  const remaining = s.deadline_days - s.total_elapsed_days;

  let status: string;
  if (completed) status = 'delivered';
  else if (remaining <= 0) status = 'overdue';
  else if (remaining <= 3) status = 'warning';
  else if (s.delay_days > 2) status = 'delay_alert';
  else status = 'in_transit';

  return {
    shipment_id: id, route_id: s.route_id,
    current_leg_index: s.current_leg_index, day_in_leg: s.day_in_leg,
    total_elapsed_days: s.total_elapsed_days, status, delay_days: s.delay_days,
    history: s.history,
  };
}
