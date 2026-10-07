/**
 * API client service for RouteWise backend.
 * Provides caching, debouncing support, and error handling.
 */

import { Location, TripPlanRequest, TripPlanResponse } from '../types/trip';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Frontend in-memory cache for recent autocomplete queries
const geocodeCache = new Map<string, Location[]>();

export async function geocodeLocation(query: string): Promise<Location[]> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  if (geocodeCache.has(clean)) {
    return geocodeCache.get(clean)!;
  }

  try {
    const res = await fetch(`${API_BASE}/api/geocode/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: clean, limit: 5 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Geocoding request failed with status ${res.status}`);
    }

    const data: Location[] = await res.json();
    geocodeCache.set(clean, data);
    return data;
  } catch (error: any) {
    console.error('Geocode error:', error);
    throw new Error(error.message || 'Unable to connect to location search service.');
  }
}

export async function planTrip(payload: TripPlanRequest): Promise<TripPlanResponse> {
  const res = await fetch(`${API_BASE}/api/plan-trip/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let msg = errorData.error || `Trip planning failed with status ${res.status}`;
    if (errorData.details) {
      const fieldErrors = Object.entries(errorData.details)
        .map(([field, errs]: [string, any]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
        .join('; ');
      msg += ` (${fieldErrors})`;
    }
    throw new Error(msg);
  }

  return await res.json();
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health/`);
    return res.ok;
  } catch {
    return false;
  }
}
