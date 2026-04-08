/**
 * Simple global state shared between screens.
 * Using a plain object + listeners pattern to avoid extra deps.
 */
import type { OptimizationRequest, OptimizationResponse, Priority, RouteResult, TrackingState } from './types';

type Listener = () => void;

interface AppState {
  // Route selection
  originId: string;
  destinationId: string;
  deadline: string;  // ISO date

  // Settings
  priority: Priority;
  maxDeviationDays: number;
  maxCostPerTon: number | null;
  timeBufferDays: number;
  useSeasonalCoefficients: boolean;

  // Results
  results: OptimizationResponse | null;

  // Tracking
  selectedRouteId: string | null;
  tracking: TrackingState | null;
}

const listeners = new Set<Listener>();

export const store: AppState = {
  originId: 'ryazan',
  destinationId: 'nhava_sheva',
  deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],

  priority: 'balanced',
  maxDeviationDays: 0,
  maxCostPerTon: null,
  timeBufferDays: 0,
  useSeasonalCoefficients: false,

  results: null,
  selectedRouteId: null,
  tracking: null,
};

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(): void {
  listeners.forEach(fn => fn());
}

export function updateStore(partial: Partial<AppState>): void {
  Object.assign(store, partial);
  notify();
}

export function buildRequest(): OptimizationRequest {
  return {
    origin_id: store.originId,
    destination_id: store.destinationId,
    deadline: store.deadline,
    current_date: new Date().toISOString().split('T')[0],
    priority: store.priority,
    max_deadline_deviation_days: store.maxDeviationDays,
    max_cost_per_ton: store.maxCostPerTon,
    time_buffer_days: store.timeBufferDays,
    use_seasonal_coefficients: store.useSeasonalCoefficients,
  };
}
