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
            "Current Cycle Used is evaluated as an aggregate active 70/8 cycle total. Exact rolling 8-day hour rollover cannot be inferred without preceding 8 daily historical records."
        )

        # Parse start datetime
        try:
            tz = zoneinfo.ZoneInfo(tz_str)
        except Exception:
            tz = zoneinfo.ZoneInfo("America/Chicago")
            tz_str = "America/Chicago"

        start_date_val: Optional[date] = data.get("start_date")
        if not start_date_val:
            start_date_val = datetime.now(tz).date()

        start_time_str: str = data.get("start_time", "06:00") or "06:00"
        try:
            parts = start_time_str.split(":")
            h, m = int(parts[0]), int(parts[1])
            start_time_val = dt_time(h, m)
        except Exception:
            start_time_val = dt_time(6, 0)
            start_time_str = "06:00"

        start_datetime = datetime.combine(start_date_val, start_time_val, tzinfo=tz)

        # Calculate Driving Route Legs via Routing Provider
        router = get_routing_provider()
        try:
            leg1 = router.calculate_leg(current_loc, pickup_loc, leg_id="leg-1")
            leg2 = router.calculate_leg(pickup_loc, dropoff_loc, leg_id="leg-2")
        except RuntimeError as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            logger.error("Routing error: %s", str(e))
            return Response({
                "error": "Unable to calculate driving route between locations. Please verify coordinates and try again."
            }, status=status.HTTP_502_BAD_GATEWAY)

        # Schedule trip with HOS limits, fuel stops, and rest periods
        scheduler = TripScheduler(
            current_loc=current_loc,
            pickup_loc=pickup_loc,
            dropoff_loc=dropoff_loc,
            leg1=leg1,
            leg2=leg2,
            initial_cycle_used=cycle_used,
            start_datetime=start_datetime,
        )
        plan_result = scheduler.plan()

        stops = plan_result["stops"]
        timeline = plan_result["timeline"]
        final_hos_state = plan_result["final_hos_state"]
        total_trip_miles = plan_result["total_trip_miles"]
        end_datetime = plan_result["end_time"]

        # Generate Daily Log Sheets
        daily_logs = generate_daily_logs(
            timeline=timeline,
            timezone_str=tz_str,
            carrier_name=adv.get("carrier_name", ""),
            main_office_address=adv.get("carrier_address", ""),
            home_terminal_address=adv.get("home_terminal_address", ""),
            truck_number=adv.get("truck_number", ""),
            trailer_number=adv.get("trailer_number", ""),
            driver_name=adv.get("driver_name", ""),
            co_driver_name=adv.get("co_driver_name", ""),
            shipping_doc_number=adv.get("shipping_doc_number", ""),
            commodity=adv.get("commodity", ""),
            initial_cycle_used=cycle_used,
        )

        # Independent Compliance Validation
        validator = ComplianceValidator(
            timeline=timeline,
            daily_logs=daily_logs,
            initial_cycle_used=cycle_used,
            expected_total_miles=leg1.distance_miles + leg2.distance_miles,
        )
        validation_result = validator.validate_all()
        warnings.extend(validation_result.get("warnings", []))

        # Count stop types
        fuel_count = sum(1 for s in stops if s.type.value == "FUEL")
        rest_30_count = sum(1 for s in stops if s.type.value == "REST_30")
        rest_10_count = sum(1 for s in stops if s.type.value == "REST_10")
        restart_34_count = sum(1 for s in stops if s.type.value == "RESTART_34")

        total_base_drive_seconds = leg1.duration_seconds + leg2.duration_seconds
        total_base_drive_hours = total_base_drive_seconds / 3600.0

        elapsed_hours = (end_datetime - start_datetime).total_seconds() / 3600.0

        # Build turn-by-turn combined instructions
        all_steps = []
        for s in leg1.steps:
            st_dict = s.to_dict()
            st_dict["leg"] = "Leg 1 (Current → Pickup)"
            all_steps.append(st_dict)
        for s in leg2.steps:
            st_dict = s.to_dict()
            st_dict["leg"] = "Leg 2 (Pickup → Dropoff)"
            all_steps.append(st_dict)

        response_payload = {
            "trip": {
                "origin": current_loc.to_dict(),
                "pickup": pickup_loc.to_dict(),
                "dropoff": dropoff_loc.to_dict(),
                "start_time": start_datetime.isoformat(),
                "end_time": end_datetime.isoformat(),
                "total_miles": round(total_trip_miles, 1),
                "leg1_miles": round(leg1.distance_miles, 1),
                "leg2_miles": round(leg2.distance_miles, 1),
                "base_driving_hours": round(total_base_drive_hours, 2),
                "base_driving_formatted": format_duration_hours(total_base_drive_hours),
                "total_elapsed_hours": round(elapsed_hours, 2),
                "total_elapsed_formatted": format_duration_hours(elapsed_hours),
                "calendar_days_count": len(daily_logs),
                "stops_count": len(stops),
            },
            "route": {
                "leg1": leg1.to_dict(),
                "leg2": leg2.to_dict(),
                "combined_coordinates": scheduler.combined_coords,
                "instructions": all_steps,
            },
            "stops": [s.to_dict() for s in stops],
            "timeline": [e.to_dict() for e in timeline],
            "daily_logs": [log.to_dict() for log in daily_logs],
            "hos_summary": {
                "initial_cycle_used": round(cycle_used, 2),
                "final_cycle_used": round(final_hos_state.cycle_used, 2),
                "final_cycle_remaining": round(final_hos_state.cycle_remaining, 2),
                "cycle_limit": CYCLE_LIMIT_HOURS,
                "fuel_stops_count": fuel_count,
                "rest_30_breaks_count": rest_30_count,
                "rest_10_resets_count": rest_10_count,
                "restart_34_count": restart_34_count,
                "status_label": "Compliant" if validation_result["is_compliant"] else "Attention Required",
                "status_message": "HOS planning checks passed under the assessment assumptions." if validation_result["is_compliant"] else "HOS checks flagged potential compliance issues.",
            },
            "validation": validation_result,
            "warnings": warnings,
            "assumptions": {
                "operation": "Property-carrying commercial motor vehicle",
                "cycle_rule": "70 hours / 8 days",
                "fuel_frequency": f"At least once every {int(FUEL_INTERVAL_MILES)} miles",
                "fuel_duration": f"{int(DEFAULT_FUEL_DURATION_HOURS * 60)} minutes On-Duty Not Driving (planning assumption)",
                "pickup_duration": f"{int(PICKUP_DURATION_HOURS)} hour On-Duty Not Driving",
                "dropoff_duration": f"{int(DROPOFF_DURATION_HOURS)} hour On-Duty Not Driving",
                "default_start_time": "06:00 local time (planning default, not regulation)",
            },
            "disclaimer": (
                "This application is an assessment and planning tool built against the FMCSA Interstate Truck Driver's "
                "Guide to Hours of Service for Property Carriers (April 2022) and the supplied project assumptions. "
                "It is informational guidance and does NOT constitute legal advice or a substitute for statutory regulations."
            ),
        }

        return Response(response_payload)
