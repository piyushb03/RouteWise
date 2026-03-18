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
