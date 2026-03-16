"""
Geocoding service with provider abstraction, caching, rate limiting, and defensive parsing.
Uses OpenStreetMap Nominatim by default.
"""

from abc import ABC, abstractmethod
import time
import requests
import logging
from typing import List, Optional, Dict, Any
from django.conf import settings
from .models import Location

logger = logging.getLogger(__name__)

# In-memory LRU-like cache for queries and coordinates
_GEOCODE_CACHE: Dict[str, List[Location]] = {}
_REVERSE_CACHE: Dict[str, Dict[str, str]] = {}
_LAST_REQUEST_TIMESTAMP: float = 0.0
NOMINATIM_RATE_LIMIT_DELAY = 1.0  # Respect 1 req/sec for public Nominatim usage


class GeocodingProvider(ABC):
    @abstractmethod
    def geocode(self, query: str, limit: int = 5) -> List[Location]:
        """Search for locations matching query."""
        pass

    @abstractmethod
    def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, str]:
        """Reverse geocode coordinate into city, state, country, formatted name."""
        pass


class NominatimGeocodingProvider(GeocodingProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        user_agent: Optional[str] = None,
        contact_email: Optional[str] = None,
        timeout: int = 8,
    ):
        self.base_url = (base_url or getattr(settings, "NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")).rstrip("/")
        self.user_agent = user_agent or getattr(settings, "MAP_USER_AGENT", "RouteWise-HOS-ELD-Planner/1.0")
        self.contact_email = contact_email or getattr(settings, "MAP_CONTACT_EMAIL", "planner@routewise.local")
        self.timeout = timeout

    def _throttle(self) -> None:
        global _LAST_REQUEST_TIMESTAMP
        now = time.time()
        elapsed = now - _LAST_REQUEST_TIMESTAMP
        if elapsed < NOMINATIM_RATE_LIMIT_DELAY:
            time.sleep(NOMINATIM_RATE_LIMIT_DELAY - elapsed)
        _LAST_REQUEST_TIMESTAMP = time.time()

    def geocode(self, query: str, limit: int = 5) -> List[Location]:
        clean_query = query.strip()
        if not clean_query or len(clean_query) < 2:
            return []

        cache_key = clean_query.lower()
        if cache_key in _GEOCODE_CACHE:
            return _GEOCODE_CACHE[cache_key]

        self._throttle()
        url = f"{self.base_url}/search"
        headers = {
            "User-Agent": f"{self.user_agent} ({self.contact_email})",
            "Accept": "application/json",
        }
        params = {
            "q": clean_query,
            "format": "jsonv2",
            "addressdetails": 1,
            "limit": limit,
            "countrycodes": "us,ca,mx",  # Prioritize North America
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.Timeout:
            logger.error("Nominatim geocoding timeout for query: %s", clean_query)
            raise RuntimeError("Geocoding service timed out. Please try again.")
        except requests.exceptions.RequestException as e:
            logger.error("Nominatim request error: %s", str(e))
            raise RuntimeError(f"Geocoding service unavailable: {e}")
        except Exception as e:
            logger.error("Unexpected geocoding error: %s", str(e))
            raise RuntimeError(f"Failed to parse geocoding response: {e}")

        results: List[Location] = []
        for item in data:
            addr = item.get("address", {})
            city = (
                addr.get("city")
                or addr.get("town")
                or addr.get("village")
                or addr.get("hamlet")
