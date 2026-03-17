"""
Routing service with provider abstraction, OSRM implementation, caching,
and detailed turn-by-turn step parsing.
"""

from abc import ABC, abstractmethod
import requests
import logging
from typing import Optional, Dict, Any, List
from django.conf import settings
from .models import Location, RouteLeg, RouteStep
from .route_geometry import decode_polyline, haversine_distance_miles
from .constants import METERS_TO_MILES

logger = logging.getLogger(__name__)

# In-memory route cache by coordinates
_ROUTE_CACHE: Dict[str, RouteLeg] = {}


class RoutingProvider(ABC):
    @abstractmethod
    def calculate_leg(self, origin: Location, destination: Location, leg_id: str) -> RouteLeg:
        """Calculate driving route between two locations."""
        pass


class OSRMRoutingProvider(RoutingProvider):
    def __init__(self, base_url: Optional[str] = None, timeout: int = 12):
        self.base_url = (base_url or getattr(settings, "OSRM_BASE_URL", "https://router.project-osrm.org")).rstrip("/")
        self.timeout = timeout

    def calculate_leg(self, origin: Location, destination: Location, leg_id: str) -> RouteLeg:
        cache_key = f"{round(origin.latitude, 4)},{round(origin.longitude, 4)}->{round(destination.latitude, 4)},{round(destination.longitude, 4)}"
        if cache_key in _ROUTE_CACHE:
            cached = _ROUTE_CACHE[cache_key]
            return RouteLeg(
                leg_id=leg_id,
                origin=origin,
                destination=destination,
                distance_miles=cached.distance_miles,
                duration_seconds=cached.duration_seconds,
                steps=cached.steps,
                geometry_coords=cached.geometry_coords,
            )

        # OSRM expects coordinates in {lon},{lat} format
        coords_str = f"{origin.longitude},{origin.latitude};{destination.longitude},{destination.latitude}"
        url = f"{self.base_url}/route/v1/driving/{coords_str}"
        params = {
            "overview": "full",
            "geometries": "polyline",
            "steps": "true",
            "annotations": "false",
        }
        headers = {
            "User-Agent": getattr(settings, "MAP_USER_AGENT", "RouteWise-HOS-ELD-Planner/1.0"),
            "Accept": "application/json",
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.Timeout:
            logger.error("OSRM routing timeout between %s and %s", origin.name, destination.name)
            raise RuntimeError(f"Routing service timed out calculating route to {destination.name}. Please try again.")
        except requests.exceptions.RequestException as e:
            logger.error("OSRM request error: %s", str(e))
            raise RuntimeError(f"Unable to reach driving route service: {e}")
        except Exception as e:
            logger.error("Unexpected error in routing response: %s", str(e))
            raise RuntimeError(f"Failed to calculate driving route: {e}")

        if data.get("code") != "Ok" or not data.get("routes"):
            msg = data.get("message", "No route found between coordinates")
            logger.warning("OSRM returned non-OK code: %s, message: %s", data.get("code"), msg)
            raise RuntimeError(f"Unable to calculate driving route between {origin.name} and {destination.name}: {msg}")

        osrm_route = data["routes"][0]
