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
        distance_meters = float(osrm_route.get("distance", 0.0))
        duration_seconds = float(osrm_route.get("duration", 0.0))
        distance_miles = distance_meters * METERS_TO_MILES

        # Decode geometry polyline
        geom_encoded = osrm_route.get("geometry", "")
        if geom_encoded:
            coords = decode_polyline(geom_encoded, precision=5)
        else:
            coords = [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]]

        # Parse turn-by-turn navigation steps
        steps: List[RouteStep] = []
        for osrm_leg in osrm_route.get("legs", []):
            for step_item in osrm_leg.get("steps", []):
                maneuver = step_item.get("maneuver", {})
                m_type = maneuver.get("type", "")
                m_modifier = maneuver.get("modifier", "")
                step_name = step_item.get("name", "")
                ref = step_item.get("ref", "")
                step_dist_m = float(step_item.get("distance", 0.0))
                step_dur_s = float(step_item.get("duration", 0.0))

                display_name = f"{ref} ({step_name})" if (ref and step_name) else (ref or step_name or "Highway")

                if m_type == "depart":
                    instr = f"Depart on {display_name}"
                elif m_type == "arrive":
                    instr = f"Arrive at {destination.name}"
                elif m_type in ("turn", "new name"):
                    direction = f"{m_modifier} onto" if m_modifier else "onto"
                    instr = f"Turn {direction} {display_name}"
                elif m_type in ("merge", "on ramp"):
                    instr = f"Take ramp onto {display_name}"
                elif m_type in ("off ramp", "fork"):
                    instr = f"Keep {m_modifier} towards {display_name}" if m_modifier else f"Take exit onto {display_name}"
                else:
                    instr = f"Continue on {display_name}"

                loc = maneuver.get("location", [0.0, 0.0])
                steps.append(RouteStep(
                    instruction=instr,
                    distance_miles=round(step_dist_m * METERS_TO_MILES, 2),
                    duration_seconds=round(step_dur_s, 1),
                    name=display_name,
                    maneuver_type=f"{m_type}_{m_modifier}".strip("_"),
                    latitude=float(loc[1]),
                    longitude=float(loc[0]),
                ))

        route_leg = RouteLeg(
            leg_id=leg_id,
            origin=origin,
            destination=destination,
            distance_miles=distance_miles,
            duration_seconds=duration_seconds,
            steps=steps,
            geometry_coords=coords,
        )

        _ROUTE_CACHE[cache_key] = route_leg
        return route_leg


_routing_provider: Optional[RoutingProvider] = None


def get_routing_provider() -> RoutingProvider:
    global _routing_provider
    if _routing_provider is None:
        _routing_provider = OSRMRoutingProvider()
    return _routing_provider
