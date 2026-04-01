"""
API Views for RouteWise:
- Health check
- Geocoding and Reverse Geocoding proxies
- Complete trip planning and HOS simulation
"""

from datetime import datetime, date, time as dt_time, timedelta
import zoneinfo
import logging
from typing import Dict, Any, List

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    GeocodeRequestSerializer,
    ReverseGeocodeRequestSerializer,
    TripPlanRequestSerializer,
)
from services.models import Location, RouteLeg, RouteStep
from services.geocoding import get_geocoding_provider
from services.routing import get_routing_provider
from services.trip_scheduler import TripScheduler
from services.daily_log import generate_daily_logs
from services.compliance_validator import ComplianceValidator
from services.constants import (
    MAX_DRIVING_HOURS,
    MAX_WINDOW_HOURS,
    CYCLE_LIMIT_HOURS,
    FUEL_INTERVAL_MILES,
    PICKUP_DURATION_HOURS,
    DROPOFF_DURATION_HOURS,
    DEFAULT_FUEL_DURATION_HOURS,
)

logger = logging.getLogger(__name__)


def format_duration_hours(hours: float) -> str:
    """Format decimal hours to 'Xh Ym' string."""
    tot_min = int(round(hours * 60))
    h = tot_min // 60
    m = tot_min % 60
    return f"{h}h {m}m"


class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "RouteWise HOS ELD Planner API",
            "version": "1.0.0",
            "timestamp": datetime.now(zoneinfo.ZoneInfo("UTC")).isoformat(),
            "providers": {
                "geocoding": "OpenStreetMap Nominatim (Free/Open)",
                "routing": "OSRM (Open Source Routing Machine)",
            }
        })


class GeocodeView(APIView):
    def post(self, request):
        serializer = GeocodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid geocoding query", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data["query"]
        limit = serializer.validated_data.get("limit", 5)
        geocoder = get_geocoding_provider()

        try:
            results = geocoder.geocode(query, limit=limit)
            return Response([loc.to_dict() for loc in results])
        except Exception as e:
            logger.error("Geocode error: %s", str(e))
            return Response(
                {"error": f"Could not resolve location '{query}'. Please try again or select from suggested cities."},
                status=status.HTTP_502_BAD_GATEWAY
            )


class ReverseGeocodeView(APIView):
    def post(self, request):
        serializer = ReverseGeocodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid coordinates", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        lat = serializer.validated_data["latitude"]
        lng = serializer.validated_data["longitude"]
        geocoder = get_geocoding_provider()

        try:
            result = geocoder.reverse_geocode(lat, lng)
            return Response(result)
        except Exception as e:
            logger.error("Reverse geocode error: %s", str(e))
            return Response(
                {"error": "Could not reverse geocode coordinates."},
                status=status.HTTP_502_BAD_GATEWAY
            )


class PlanTripView(APIView):
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "error": "Validation failed on trip inputs.",
                "details": serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        cur_raw = data["current_location"]
        pic_raw = data["pickup_location"]
        dro_raw = data["dropoff_location"]
        cycle_used = float(data["cycle_used_hours"])
        adv = data.get("advanced", {})
        tz_str = data.get("timezone", "America/Chicago")

        # Construct domain Location objects
        current_loc = Location(
            name=cur_raw["name"],
            formatted_address=cur_raw.get("formatted_address", cur_raw["name"]),
            latitude=float(cur_raw["latitude"]),
            longitude=float(cur_raw["longitude"]),
            city=cur_raw.get("city", ""),
            state=cur_raw.get("state", ""),
            country=cur_raw.get("country", "US"),
        )
        pickup_loc = Location(
            name=pic_raw["name"],
            formatted_address=pic_raw.get("formatted_address", pic_raw["name"]),
            latitude=float(pic_raw["latitude"]),
            longitude=float(pic_raw["longitude"]),
            city=pic_raw.get("city", ""),
            state=pic_raw.get("state", ""),
            country=pic_raw.get("country", "US"),
        )
        dropoff_loc = Location(
            name=dro_raw["name"],
            formatted_address=dro_raw.get("formatted_address", dro_raw["name"]),
            latitude=float(dro_raw["latitude"]),
            longitude=float(dro_raw["longitude"]),
            city=dro_raw.get("city", ""),
            state=dro_raw.get("state", ""),
            country=dro_raw.get("country", "US"),
        )

        warnings: List[str] = []

        # Scope warning for non-US locations
        if any(loc.country.upper() not in ("US", "USA") for loc in (current_loc, pickup_loc, dropoff_loc)):
            warnings.append(
                "One or more locations are outside the United States. Note that this planner models US FMCSA interstate property-carrier regulations."
            )

        # Conservative cycle explanation notice
        warnings.append(
