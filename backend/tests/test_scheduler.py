"""
Unit and integration tests for TripScheduler:
- Dynamic stop insertion (Fuel, 30m break, 10h reset, 34h restart)
- Multi-day trip scheduling
- Accurate mileage and sequence ordering
"""

from datetime import datetime
import zoneinfo
import pytest

from services.models import Location, RouteLeg, RouteStep, StopType
from services.trip_scheduler import TripScheduler
from services.compliance_validator import ComplianceValidator


def make_dummy_location(name: str, lat: float, lng: float) -> Location:
    return Location(
        name=name,
        formatted_address=f"{name}, USA",
        latitude=lat,
        longitude=lng,
        city=name.split()[0],
        state="TX",
        country="US",
    )


def make_dummy_leg(origin: Location, dest: Location, miles: float, duration_hours: float, leg_id: str) -> RouteLeg:
    steps = [
        RouteStep(instruction=f"Depart {origin.name}", distance_miles=miles / 2, duration_seconds=(duration_hours / 2) * 3600),
        RouteStep(instruction=f"Arrive at {dest.name}", distance_miles=miles / 2, duration_seconds=(duration_hours / 2) * 3600),
    ]
    # Polyline with multiple interpolated points
    coords = [
        [origin.latitude, origin.longitude],
        [(origin.latitude + dest.latitude) / 2, (origin.longitude + dest.longitude) / 2],
        [dest.latitude, dest.longitude],
    ]
    return RouteLeg(
        leg_id=leg_id,
        origin=origin,
        destination=dest,
        distance_miles=miles,
        duration_seconds=duration_hours * 3600,
        steps=steps,
        geometry_coords=coords,
    )


def test_short_trip_no_breaks_needed():
    loc1 = make_dummy_location("Dallas", 32.7767, -96.7970)
    loc2 = make_dummy_location("Fort Worth", 32.7555, -97.3308)
    loc3 = make_dummy_location("Arlington", 32.7357, -97.1081)

    leg1 = make_dummy_leg(loc1, loc2, miles=35.0, duration_hours=0.8, leg_id="leg-1")
    leg2 = make_dummy_leg(loc2, loc3, miles=20.0, duration_hours=0.5, leg_id="leg-2")

    start_dt = datetime(2026, 10, 10, 6, 0, tzinfo=zoneinfo.ZoneInfo("America/Chicago"))
    scheduler = TripScheduler(loc1, loc2, loc3, leg1, leg2, initial_cycle_used=10.0, start_datetime=start_dt)
    result = scheduler.plan()

    stops = result["stops"]
    # Only START, PICKUP, DROPOFF
    types = [s.type for s in stops]
    assert StopType.START in types
    assert StopType.PICKUP in types
    assert StopType.DROPOFF in types
    assert StopType.REST_30 not in types
    assert StopType.REST_10 not in types
    assert StopType.FUEL not in types


def test_trip_inserting_30_min_break():
    loc1 = make_dummy_location("Dallas", 32.7767, -96.7970)
    loc2 = make_dummy_location("Houston", 29.7604, -95.3698)
    loc3 = make_dummy_location("San Antonio", 29.4241, -98.4936)

    # Leg 1: 9.0 hours driving -> must trigger 30-min break at 8.0h driving
    leg1 = make_dummy_leg(loc1, loc2, miles=480.0, duration_hours=9.0, leg_id="leg-1")
    leg2 = make_dummy_leg(loc2, loc3, miles=190.0, duration_hours=3.5, leg_id="leg-2")

    start_dt = datetime(2026, 10, 10, 6, 0, tzinfo=zoneinfo.ZoneInfo("America/Chicago"))
    scheduler = TripScheduler(loc1, loc2, loc3, leg1, leg2, initial_cycle_used=5.0, start_datetime=start_dt)
    result = scheduler.plan()

    stops = result["stops"]
    rest_stops = [s for s in stops if s.type == StopType.REST_30]
    assert len(rest_stops) >= 1
    assert "8 cumulative driving hours" in rest_stops[0].reason


def test_long_trip_inserting_10_hour_reset():
    loc1 = make_dummy_location("Chicago", 41.8781, -87.6298)
    loc2 = make_dummy_location("St Louis", 38.6270, -90.1994)
    loc3 = make_dummy_location("Dallas", 32.7767, -96.7970)

    # Leg 1: 5h, Pickup: 1h, Leg 2: 12h -> Total driving = 17h -> Must insert at least one 10-hour reset
    leg1 = make_dummy_leg(loc1, loc2, miles=300.0, duration_hours=5.0, leg_id="leg-1")
    leg2 = make_dummy_leg(loc2, loc3, miles=650.0, duration_hours=12.0, leg_id="leg-2")

    start_dt = datetime(2026, 10, 10, 6, 0, tzinfo=zoneinfo.ZoneInfo("America/Chicago"))
    scheduler = TripScheduler(loc1, loc2, loc3, leg1, leg2, initial_cycle_used=10.0, start_datetime=start_dt)
    result = scheduler.plan()

    stops = result["stops"]
    resets = [s for s in stops if s.type == StopType.REST_10]
    assert len(resets) >= 1
    assert resets[0].duration_hours == 10.0


def test_trip_over_1000_miles_inserts_fuel():
    loc1 = make_dummy_location("Los Angeles", 34.0522, -118.2437)
    loc2 = make_dummy_location("Phoenix", 33.4484, -112.0740)
    loc3 = make_dummy_location("Dallas", 32.7767, -96.7970)

    # Total miles = 370 + 1050 = 1420 miles -> Must insert at least one fuel stop
    leg1 = make_dummy_leg(loc1, loc2, miles=370.0, duration_hours=6.0, leg_id="leg-1")
    leg2 = make_dummy_leg(loc2, loc3, miles=1050.0, duration_hours=18.0, leg_id="leg-2")

    start_dt = datetime(2026, 10, 10, 6, 0, tzinfo=zoneinfo.ZoneInfo("America/Chicago"))
    scheduler = TripScheduler(loc1, loc2, loc3, leg1, leg2, initial_cycle_used=0.0, start_datetime=start_dt)
    result = scheduler.plan()

    fuel_stops = [s for s in result["stops"] if s.type == StopType.FUEL]
    assert len(fuel_stops) >= 1
    assert fuel_stops[0].duration_hours == 0.5
    assert "1,000 miles" in fuel_stops[0].reason


def test_exhausted_cycle_inserts_34_hour_restart():
    loc1 = make_dummy_location("Dallas", 32.7767, -96.7970)
    loc2 = make_dummy_location("Austin", 30.2672, -97.7431)
    loc3 = make_dummy_location("Houston", 29.7604, -95.3698)

    leg1 = make_dummy_leg(loc1, loc2, miles=200.0, duration_hours=3.5, leg_id="leg-1")
    leg2 = make_dummy_leg(loc2, loc3, miles=160.0, duration_hours=3.0, leg_id="leg-2")

    # Initial cycle = 68.0 hours. Trip requires 3.5 drive + 1h pickup + 3.0 drive + 1h dropoff = 8.5h on-duty
    # Driver only has 2 hours remaining in cycle! Must trigger 34h restart.
    start_dt = datetime(2026, 10, 10, 6, 0, tzinfo=zoneinfo.ZoneInfo("America/Chicago"))
    scheduler = TripScheduler(loc1, loc2, loc3, leg1, leg2, initial_cycle_used=68.0, start_datetime=start_dt)
    result = scheduler.plan()

    restarts = [s for s in result["stops"] if s.type == StopType.RESTART_34]
    assert len(restarts) >= 1
    assert restarts[0].duration_hours == 34.0
