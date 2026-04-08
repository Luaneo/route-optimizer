export type PointType = 'city' | 'port';

export type TransportType = 'rail' | 'truck' | 'sea' | 'port_services' | 'transit' | 'feeder';

export type CurrencyType = 'RUB' | 'USD';

export type Priority = 'min_cost' | 'min_time' | 'balanced';

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  point_type: PointType;
  country: string;
}

export interface RouteLeg {
  id: string;
  route_id: string;
  transport_type: TransportType;
  label: string;
  origin: string;
  destination: string;
  distance_km: number;
  cost_per_ton: number;
  currency: CurrencyType;
  duration_days: number;
  cost_min: number;
  cost_max: number;
  duration_min: number;
  duration_max: number;
}

export interface Route {
  id: string;
  name: string;
  origin_id: string;
  destination_id: string;
  legs: RouteLeg[];
}

export interface OptimizationRequest {
  origin_id: string;
  destination_id: string;
  deadline: string;
  current_date: string;
  priority: Priority;
  max_deadline_deviation_days: number;
  max_cost_per_ton: number | null;
  time_buffer_days: number;
  use_seasonal_coefficients: boolean;
}

export interface LegResult {
  label: string;
  transport_type: TransportType;
  origin: string;
  destination: string;
  distance_km: number;
  cost_per_ton: number;
  currency: CurrencyType;
  duration_days: number;
}

export interface RouteResult {
  route_id: string;
  route_name: string;
  legs: LegResult[];
  total_cost_rub: number;
  total_cost_usd: number;
  total_duration_days: number;
  duration_min: number;
  duration_max: number;
  deadline_deviation_days: number;
  savings_vs_cheapest: number;
  score: number;
  criterion: string;
}

export interface OptimizationResponse {
  routes: RouteResult[];
  usd_rate: number;
}

export interface TrackingHistoryEntry {
  day: number;
  event: string;
  location: string;
}

export interface TrackingState {
  shipment_id: string;
  route_id: string;
  current_leg_index: number;
  day_in_leg: number;
  total_elapsed_days: number;
  status: string;
  delay_days: number;
  history: TrackingHistoryEntry[];
}

export interface LocationCreate {
  name: string;
  lat: number;
  lng: number;
  point_type: PointType;
  country: string;
}

export interface LegUpdate {
  cost_per_ton?: number;
  cost_min?: number;
  cost_max?: number;
  duration_days?: number;
  duration_min?: number;
  duration_max?: number;
  currency?: CurrencyType;
}

export interface ApiService {
  getLocations(): Promise<Location[]>;
  createLocation(data: LocationCreate): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  getRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route>;
  updateLeg(routeId: string, legId: string, data: LegUpdate): Promise<RouteLeg>;
  optimize(request: OptimizationRequest): Promise<OptimizationResponse>;
  startTracking(routeId: string, deadlineDays: number): Promise<TrackingState>;
  tickTracking(shipmentId: string): Promise<TrackingState>;
  getTracking(shipmentId: string): Promise<TrackingState>;
}
