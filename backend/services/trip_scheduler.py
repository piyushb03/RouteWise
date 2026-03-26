"""
Trip Scheduler: Deterministic multi-leg planning engine.

Simulates truck travel along route geometry and dynamically inserts:
- 30-minute rest breaks (after 8 cumulative driving hours)
- 10-hour off-duty resets (after 11h driving or 14h window limit)
- 30-minute fuel stops (before 1,000 miles since last fueling)
- 34-hour cycle restarts (when 70/8 cycle is exhausted)
- 1-hour pickup and 1-hour dropoff on-duty periods
"""

from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any, Tuple, Optional

from .constants import (
    FUEL_INTERVAL_MILES,
    PICKUP_DURATION_HOURS,
    DROPOFF_DURATION_HOURS,
    DEFAULT_FUEL_DURATION_HOURS,
    MANDATORY_DRIVING_BREAK_HOURS,
    DAILY_RESTART_HOURS,
    CYCLE_RESTART_HOURS,
    DEFAULT_TRUCK_AVERAGE_SPEED_MPH,
)
from .models import (
    Location,
    RouteLeg,
    Stop,
    StopType,
    DutyStatus,
    TimelineEvent,
    HOSState,
)
from .hos_engine import HOSEngine
from .route_geometry import (
    compute_cumulative_distances_miles,
    interpolate_point_at_mile,
)
from .geocoding import get_geocoding_provider

logger = logging.getLogger(__name__)


class TripScheduler:
    def __init__(
        self,
        current_loc: Location,
        pickup_loc: Location,
        dropoff_loc: Location,
        leg1: RouteLeg,
        leg2: RouteLeg,
        initial_cycle_used: float,
        start_datetime: datetime,
    ):
        self.current_loc = current_loc
        self.pickup_loc = pickup_loc
        self.dropoff_loc = dropoff_loc
        self.leg1 = leg1
        self.leg2 = leg2
        self.initial_cycle_used = initial_cycle_used
        self.start_datetime = start_datetime

        self.hos = HOSEngine(initial_cycle_used=initial_cycle_used)
        self.geocoder = get_geocoding_provider()

        # Combined route geometry across both legs
        self.combined_coords: List[List[float]] = []
        self.cumulative_geometry_miles: List[float] = []
        self._init_combined_geometry()

        self.stops: List[Stop] = []
        self.timeline: List[TimelineEvent] = []
        self.current_time = start_datetime
        self.current_trip_mile = 0.0
        self.cumulative_miles_since_fuel = 0.0
        self.stop_counter = 1

    def _init_combined_geometry(self) -> None:
        """Combine Leg 1 and Leg 2 coordinates into a continuous coordinate sequence."""
        coords1 = self.leg1.geometry_coords or [[self.leg1.origin.latitude, self.leg1.origin.longitude], [self.leg1.destination.latitude, self.leg1.destination.longitude]]
        coords2 = self.leg2.geometry_coords or [[self.leg2.origin.latitude, self.leg2.origin.longitude], [self.leg2.destination.latitude, self.leg2.destination.longitude]]

        # Avoid duplicating the pickup point where leg 1 ends and leg 2 begins
        self.combined_coords = list(coords1)
        if coords2:
            self.combined_coords.extend(coords2[1:])

        self.cumulative_geometry_miles = compute_cumulative_distances_miles(self.combined_coords)

    def _get_location_info_at_mile(self, route_mile: float) -> Tuple[float, float, str, str, str]:
        """Interpolates coordinate along route and returns (lat, lng, city, state, location_str)."""
        lat, lng = interpolate_point_at_mile(self.combined_coords, self.cumulative_geometry_miles, route_mile)
        rev = self.geocoder.reverse_geocode(lat, lng)
        city = rev.get("city", "")
        state = rev.get("state", "")
        loc_str = rev.get("location_str", f"Route Mile {round(route_mile, 1)}")
        return lat, lng, city, state, loc_str

    def plan(self) -> Dict[str, Any]:
        """Execute deterministic schedule generation."""
        # 1. Start Event
        start_lat = self.current_loc.latitude
        start_lng = self.current_loc.longitude
        start_stop = Stop(
            stop_id="stop-start",
            type=StopType.START,
            title=f"Start Trip: {self.current_loc.name}",
            reason="Trip departure origin",
            latitude=start_lat,
            longitude=start_lng,
            route_mile=0.0,
            start_time=self.current_time.isoformat(),
            end_time=self.current_time.isoformat(),
            duration_hours=0.0,
            city=self.current_loc.city,
            state=self.current_loc.state,
            is_hos_required=False,
            is_approximate=False,
        )
        self.stops.append(start_stop)

        # 2. Drive Leg 1: Current -> Pickup
        self._simulate_driving_leg(self.leg1, "Leg 1 (Current to Pickup)")

        # 3. Arrive Pickup & 1-hour On-Duty Loading
        self._handle_pickup_operation()

        # 4. Drive Leg 2: Pickup -> Dropoff
        self._simulate_driving_leg(self.leg2, "Leg 2 (Pickup to Dropoff)")

        # 5. Arrive Dropoff & 1-hour On-Duty Unloading
        self._handle_dropoff_operation()

        # 6. Trip Complete
        completion_event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.OFF_DUTY,
            activity_type="TRIP_COMPLETE",
            start_time=self.current_time,
            end_time=self.current_time,
            duration_hours=0.0,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=self.dropoff_loc.name,
            end_location=self.dropoff_loc.name,
            start_lat=self.dropoff_loc.latitude,
            start_lng=self.dropoff_loc.longitude,
            end_lat=self.dropoff_loc.latitude,
            end_lng=self.dropoff_loc.longitude,
            reason="Trip destination reached, unloading completed. Driver off duty.",
            notes="Assessment property-carrying interstate trip complete.",
        )
        self.timeline.append(completion_event)

        final_hos_state = self.hos.get_hos_state(self.dropoff_loc.name, self.current_trip_mile)

        return {
            "stops": self.stops,
            "timeline": self.timeline,
            "final_hos_state": final_hos_state,
            "total_trip_miles": self.current_trip_mile,
            "start_time": self.start_datetime,
            "end_time": self.current_time,
        }

    def _simulate_driving_leg(self, leg: RouteLeg, leg_label: str) -> None:
        """Drive the entire distance of a leg, dynamically splitting and inserting stops."""
        leg_miles_remaining = leg.distance_miles
        leg_duration_seconds = max(leg.duration_seconds, 60.0)  # at least 1 min
        leg_total_hours = leg_duration_seconds / 3600.0
        leg_speed_mph = (leg.distance_miles / leg_total_hours) if leg_total_hours > 0.0 else DEFAULT_TRUCK_AVERAGE_SPEED_MPH

        while leg_miles_remaining > 0.01:
            # 1. Check if cycle is completely exhausted before we can drive
            if self.hos.cycle_remaining < 0.1:
                self._insert_cycle_restart(reason="34-hour restart scheduled because 70-hour cycle was exhausted.")

            # 2. Check if daily window/driving limit is exhausted before we can drive
            if self.hos.driving_remaining_in_window < 0.1 or self.hos.window_remaining < 0.1:
                self._insert_daily_reset(reason="10-hour off-duty reset required before driving (11-hour driving or 14-hour window reached).")

            # 3. Calculate max continuous driving allowed by HOS clocks
            max_hos_drive_hours = self.hos.max_continuous_driving_allowed()
            if max_hos_drive_hours < 0.02:  # Less than ~1 minute
                binding_rule = self.hos.which_limit_binds()
                if binding_rule == "CYCLE_70":
                    self._insert_cycle_restart(reason="34-hour restart scheduled to preserve 70/8 compliance.")
                elif binding_rule in ("DRIVING_11", "WINDOW_14"):
                    self._insert_daily_reset(reason="10-hour off-duty reset required before resuming driving.")
                else:
                    self._insert_30_min_break(reason="30-minute rest break required after 8 cumulative driving hours.")
                continue

            # 4. Check fuel constraint: max driving before 1,000 miles since last fueling
            miles_until_fuel = max(0.0, FUEL_INTERVAL_MILES - self.cumulative_miles_since_fuel)
            max_fuel_drive_hours = miles_until_fuel / leg_speed_mph

            # 5. Remaining driving needed for this leg
            hours_needed_for_leg = leg_miles_remaining / leg_speed_mph
