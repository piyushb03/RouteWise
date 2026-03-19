"""
Route geometry utilities:
- Haversine distance
- Polyline decoding
- Cumulative distance mapping
- Exact interpolation of coordinates at any given route mile
- Geometry slicing between mile markers
"""

import math
from typing import List, Tuple, Optional
from .constants import METERS_TO_MILES, MILES_TO_METERS


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth (meters)."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def haversine_distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in miles."""
    return haversine_distance_meters(lat1, lon1, lat2, lon2) * METERS_TO_MILES


def decode_polyline(encoded: str, precision: int = 5) -> List[List[float]]:
    """
    Decodes an encoded polyline string into a list of [lat, lng] coordinates.
    Precision 5 (default for OSRM) or 6.
    """
    factor = 10.0 ** precision
    coordinates: List[List[float]] = []
    index = 0
    length = len(encoded)
    lat = 0
    lng = 0

    while index < length:
        # Decode latitude
        shift = 0
        result = 0
        while True:
            if index >= length:
                break
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        # Decode longitude
        shift = 0
        result = 0
        while True:
            if index >= length:
                break
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        coordinates.append([lat / factor, lng / factor])

    return coordinates


def compute_cumulative_distances_miles(coords: List[List[float]]) -> List[float]:
    """
    Given a list of [lat, lng], returns an array of cumulative miles from start.
    distances[0] == 0.0
    """
    if not coords:
        return []
    cumulative = [0.0]
    total = 0.0
    for i in range(1, len(coords)):
        lat1, lon1 = coords[i - 1][0], coords[i - 1][1]
        lat2, lon2 = coords[i][0], coords[i][1]
        seg_dist = haversine_distance_miles(lat1, lon1, lat2, lon2)
        total += seg_dist
        cumulative.append(total)
    return cumulative


def interpolate_point_at_mile(
    coords: List[List[float]],
    cumulative_miles: List[float],
    target_mile: float
) -> Tuple[float, float]:
    """
    Interpolates a [lat, lng] along the polyline at target_mile from route start.
    If target_mile <= 0, returns the first coordinate.
    If target_mile >= total_miles, returns the last coordinate.
    """
    if not coords:
        return (0.0, 0.0)
    if len(coords) == 1 or target_mile <= 0.0:
        return (coords[0][0], coords[0][1])

    total_miles = cumulative_miles[-1]
    if target_mile >= total_miles:
        return (coords[-1][0], coords[-1][1])

    # Binary search or scan for segment
    for i in range(1, len(cumulative_miles)):
        if cumulative_miles[i] >= target_mile:
            m_prev = cumulative_miles[i - 1]
            m_curr = cumulative_miles[i]
            span = m_curr - m_prev
            if span <= 1e-7:
                return (coords[i][0], coords[i][1])

            ratio = (target_mile - m_prev) / span
            lat = coords[i - 1][0] + ratio * (coords[i][0] - coords[i - 1][0])
            lng = coords[i - 1][1] + ratio * (coords[i][1] - coords[i - 1][1])
            return (lat, lng)

    return (coords[-1][0], coords[-1][1])


def slice_geometry(
    coords: List[List[float]],
    cumulative_miles: List[float],
    start_mile: float,
    end_mile: float
) -> List[List[float]]:
    """
    Extracts polyline coordinates between start_mile and end_mile,
    including exact interpolated endpoints.
    """
    if not coords or start_mile >= end_mile:
        return []

    p_start = interpolate_point_at_mile(coords, cumulative_miles, start_mile)
    p_end = interpolate_point_at_mile(coords, cumulative_miles, end_mile)

    sliced: List[List[float]] = [[p_start[0], p_start[1]]]

    for i in range(len(coords)):
        m = cumulative_miles[i]
        if start_mile < m < end_mile:
            sliced.append(coords[i])

    sliced.append([p_end[0], p_end[1]])
    return sliced
