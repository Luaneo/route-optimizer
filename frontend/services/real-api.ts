/**
 * Real API implementation — calls the FastAPI backend.
 */
import type {
  ApiService, LegUpdate, Location, LocationCreate,
  OptimizationRequest, OptimizationResponse, Route,
  RouteLeg, TrackingState,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const realApi: ApiService = {
  getLocations: () => request<Location[]>('/api/locations'),

  createLocation: (data: LocationCreate) =>
    request<Location>('/api/locations', { method: 'POST', body: JSON.stringify(data) }),

  deleteLocation: (id: string) =>
    request<void>(`/api/locations/${id}`, { method: 'DELETE' }),

  getRoutes: () => request<Route[]>('/api/routes'),

  getRoute: (id: string) => request<Route>(`/api/routes/${id}`),

  updateLeg: (routeId: string, legId: string, data: LegUpdate) =>
    request<RouteLeg>(`/api/routes/${routeId}/legs/${legId}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),

  optimize: (req: OptimizationRequest) =>
    request<OptimizationResponse>('/api/optimize', {
      method: 'POST', body: JSON.stringify(req),
    }),

  startTracking: (routeId: string, deadlineDays: number) =>
    request<TrackingState>(`/api/tracking/start?route_id=${routeId}&deadline_days=${deadlineDays}`, {
      method: 'POST',
    }),

  tickTracking: (shipmentId: string) =>
    request<TrackingState>(`/api/tracking/${shipmentId}/tick`, { method: 'POST' }),

  getTracking: (shipmentId: string) =>
    request<TrackingState>(`/api/tracking/${shipmentId}`),
};
