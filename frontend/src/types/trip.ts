/**
 * TypeScript Interfaces for RouteWise ELD Trip Planner
 */

export type DutyStatus = 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY_NOT_DRIVING';

export type StopType = 'START' | 'PICKUP' | 'DROPOFF' | 'FUEL' | 'REST_30' | 'REST_10' | 'RESTART_34';

export interface Location {
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  source?: string;
}

export interface RouteStep {
  instruction: string;
  distance_miles: number;
  duration_seconds: number;
  name: string;
  maneuver_type: string;
  latitude: number;
  longitude: number;
  leg?: string;
}

export interface RouteLeg {
  leg_id: string;
  origin: Location;
  destination: Location;
  distance_miles: number;
  duration_seconds: number;
  steps: RouteStep[];
  geometry_coords: [number, number][];
}

export interface RouteData {
  leg1: RouteLeg;
  leg2: RouteLeg;
  combined_coordinates: [number, number][];
  instructions: RouteStep[];
}

export interface Stop {
  stop_id: string;
  type: StopType;
  title: string;
  reason: string;
  latitude: number;
  longitude: number;
  route_mile: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
  city: string;
  state: string;
  is_hos_required: boolean;
  satisfies_break: boolean;
  satisfies_daily_reset: boolean;
  satisfies_cycle_restart: boolean;
  is_approximate: boolean;
}

export interface TimelineEvent {
  event_id: string;
  status: DutyStatus;
  activity_type: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  start_mile: number;
  end_mile: number;
  start_location: string;
  end_location: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  reason: string;
  notes: string;
}

export interface DailySegment {
  status: DutyStatus;
  grid_row_index: number;
  start_minute: number;
  end_minute: number;
  duration_hours: number;
  start_time_str: string;
  end_time_str: string;
}

export interface DailyRemark {
  time_str: string;
  location_str: string;
  status: DutyStatus;
  activity: string;
  mile: number;
}

export interface DailyRecap {
  on_duty_today: number;
  total_hours_last_7_days: number;
  hours_available_tomorrow: number;
  total_hours_last_8_days: number;
  took_34_restart: boolean;
}

export interface DailyLog {
  day_number: number;
  date_str: string;
  from_location: string;
  to_location: string;
  miles_driving_today: number;
  total_mileage_today: number;
  carrier_name: string;
  main_office_address: string;
  home_terminal_address: string;
  truck_number: string;
  trailer_number: string;
  driver_name: string;
  co_driver_name: string;
  shipping_doc_number: string;
  commodity: string;
  hours_off_duty: number;
  hours_sleeper_berth: number;
  hours_driving: number;
  hours_on_duty_not_driving: number;
  total_hours: number;
  segments: DailySegment[];
  remarks: DailyRemark[];
  recap?: DailyRecap;
}

export interface HOSSummary {
  initial_cycle_used: number;
  final_cycle_used: number;
  final_cycle_remaining: number;
  cycle_limit: number;
  fuel_stops_count: number;
  rest_30_breaks_count: number;
  rest_10_resets_count: number;
  restart_34_count: number;
  status_label: 'Compliant' | 'Attention Required';
  status_message: string;
}

export interface ValidationResult {
  is_compliant: boolean;
  passed_checks_count: number;
  failed_checks_count: number;
  passed_checks: string[];
  failed_checks: string[];
  warnings: string[];
}

export interface TripSummary {
  origin: Location;
  pickup: Location;
  dropoff: Location;
  start_time: string;
  end_time: string;
  total_miles: number;
  leg1_miles: number;
  leg2_miles: number;
  base_driving_hours: number;
  base_driving_formatted: string;
  total_elapsed_hours: number;
  total_elapsed_formatted: string;
  calendar_days_count: number;
  stops_count: number;
}

export interface TripPlanResponse {
  trip: TripSummary;
  route: RouteData;
  stops: Stop[];
  timeline: TimelineEvent[];
  daily_logs: DailyLog[];
  hos_summary: HOSSummary;
  validation: ValidationResult;
  warnings: string[];
  assumptions: Record<string, string>;
  disclaimer: string;
}

export interface AdvancedTripSettings {
  driver_name: string;
  co_driver_name: string;
  carrier_name: string;
  carrier_address: string;
  home_terminal_address: string;
  truck_number: string;
  trailer_number: string;
  shipping_doc_number: string;
  commodity: string;
}

export interface TripPlanRequest {
  current_location: Location;
  pickup_location: Location;
  dropoff_location: Location;
  cycle_used_hours: number;
  start_date?: string;
  start_time?: string;
  timezone?: string;
  advanced?: AdvancedTripSettings;
}
