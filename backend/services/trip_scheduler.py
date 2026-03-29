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

            # Determine the driving slice
            drive_slice_hours = min(max_hos_drive_hours, max_fuel_drive_hours, hours_needed_for_leg)

            # Safeguard against tiny numerical stalls
            if drive_slice_hours < 0.01:
                drive_slice_hours = 0.01

            drive_slice_miles = drive_slice_hours * leg_speed_mph
            if drive_slice_miles > leg_miles_remaining:
                drive_slice_miles = leg_miles_remaining
                drive_slice_hours = drive_slice_miles / leg_speed_mph

            # Execute driving slice
            seg_start_mile = self.current_trip_mile
            seg_end_mile = self.current_trip_mile + drive_slice_miles
            seg_start_time = self.current_time
            seg_end_time = seg_start_time + timedelta(hours=drive_slice_hours)

            start_lat, start_lng, _, _, start_loc_str = self._get_location_info_at_mile(seg_start_mile)
            end_lat, end_lng, _, _, end_loc_str = self._get_location_info_at_mile(seg_end_mile)

            driving_event = TimelineEvent(
                event_id=f"event-{len(self.timeline) + 1}",
                status=DutyStatus.DRIVING,
                activity_type="DRIVING",
                start_time=seg_start_time,
                end_time=seg_end_time,
                duration_hours=drive_slice_hours,
                start_mile=seg_start_mile,
                end_mile=seg_end_mile,
                start_location=start_loc_str,
                end_location=end_loc_str,
                start_lat=start_lat,
                start_lng=start_lng,
                end_lat=end_lat,
                end_lng=end_lng,
                reason=f"Driving route ({leg_label})",
                notes=f"Distance: {round(drive_slice_miles, 1)} mi at ~{round(leg_speed_mph, 1)} mph",
            )
            self.timeline.append(driving_event)

            # Advance state
            self.hos.apply_driving(drive_slice_hours)
            self.current_time = seg_end_time
            self.current_trip_mile = seg_end_mile
            self.cumulative_miles_since_fuel += drive_slice_miles
            leg_miles_remaining -= drive_slice_miles

            # If leg is complete, we are done with driving loop for this leg
            if leg_miles_remaining <= 0.01:
                break

            # If we didn't finish the leg, a stop is required! Determine what stop to insert:
            # Check fuel first (or if fuel coincides with 30-min break)
            needs_fuel = self.cumulative_miles_since_fuel >= (FUEL_INTERVAL_MILES - 1.0)
            binding = self.hos.which_limit_binds()

            if needs_fuel:
                # 30-minute fuel stop satisfies both fueling and the 30-min break if needed
                self._insert_fuel_stop(
                    reason="Planned before 1,000 miles since the previous fuel stop.",
                    satisfies_break=(self.hos.driving_until_break < 0.2),
                )
            elif binding == "REST_30_BREAK" or self.hos.driving_until_break < 0.05:
                self._insert_30_min_break(reason="Required after 8 cumulative driving hours.")
            elif binding in ("DRIVING_11", "WINDOW_14") or self.hos.driving_remaining_in_window < 0.05 or self.hos.window_remaining < 0.05:
                self._insert_daily_reset(reason="Required to resume driving after 11-hour driving / 14-hour window limit.")
            elif binding == "CYCLE_70" or self.hos.cycle_remaining < 0.1:
                self._insert_cycle_restart(reason="Scheduled because remaining 70/8 cycle hours are insufficient.")
            else:
                # Defensive check: if window or break timer is low
                self._insert_30_min_break(reason="Mandatory rest break before resuming route.")

    def _handle_pickup_operation(self) -> None:
        """1-hour on-duty pickup loading operation."""
        # Check cycle and window capacity before doing 1h of on-duty work
        if self.hos.cycle_remaining < PICKUP_DURATION_HOURS:
            self._insert_cycle_restart(reason="34-hour restart required: insufficient cycle hours for pickup loading.")

        if self.hos.window_remaining < PICKUP_DURATION_HOURS and self.hos.window_active:
            # Prefer 10-hour rest if window is about to expire so driver has fresh window
            self._insert_daily_reset(reason="10-hour off-duty reset scheduled before pickup to provide a fresh 14-hour window.")

        start_time = self.current_time
        end_time = start_time + timedelta(hours=PICKUP_DURATION_HOURS)

        stop = Stop(
            stop_id=f"stop-{self.stop_counter}",
            type=StopType.PICKUP,
            title=f"Pickup: {self.pickup_loc.name}",
            reason="Shipper cargo loading (1.0 hr On-Duty Not Driving)",
            latitude=self.pickup_loc.latitude,
            longitude=self.pickup_loc.longitude,
            route_mile=self.current_trip_mile,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=PICKUP_DURATION_HOURS,
            city=self.pickup_loc.city,
            state=self.pickup_loc.state,
            is_hos_required=True,
            satisfies_break=True,  # 1 hour >= 30 min satisfies break
            is_approximate=False,
        )
        self.stop_counter += 1
        self.stops.append(stop)

        event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            activity_type="PICKUP",
            start_time=start_time,
            end_time=end_time,
            duration_hours=PICKUP_DURATION_HOURS,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=self.pickup_loc.name,
            end_location=self.pickup_loc.name,
            start_lat=self.pickup_loc.latitude,
            start_lng=self.pickup_loc.longitude,
            end_lat=self.pickup_loc.latitude,
            end_lng=self.pickup_loc.longitude,
            reason="Cargo pickup and loading at shipper",
            notes="1 hour On Duty (Not Driving). Satisfies 30-minute rest break requirement.",
        )
        self.timeline.append(event)

        # Apply to HOS (counts toward window and cycle, resets 30-min break)
        self.hos.apply_on_duty_not_driving(PICKUP_DURATION_HOURS)
        self.current_time = end_time

    def _handle_dropoff_operation(self) -> None:
        """1-hour on-duty dropoff unloading operation."""
        if self.hos.cycle_remaining < DROPOFF_DURATION_HOURS:
            self._insert_cycle_restart(reason="34-hour restart required: insufficient cycle hours for dropoff unloading.")

        start_time = self.current_time
        end_time = start_time + timedelta(hours=DROPOFF_DURATION_HOURS)

        stop = Stop(
            stop_id=f"stop-{self.stop_counter}",
            type=StopType.DROPOFF,
            title=f"Dropoff: {self.dropoff_loc.name}",
            reason="Receiver cargo unloading (1.0 hr On-Duty Not Driving)",
            latitude=self.dropoff_loc.latitude,
            longitude=self.dropoff_loc.longitude,
            route_mile=self.current_trip_mile,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=DROPOFF_DURATION_HOURS,
            city=self.dropoff_loc.city,
            state=self.dropoff_loc.state,
            is_hos_required=True,
            satisfies_break=True,
            is_approximate=False,
        )
        self.stop_counter += 1
        self.stops.append(stop)

        event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            activity_type="DROPOFF",
            start_time=start_time,
            end_time=end_time,
            duration_hours=DROPOFF_DURATION_HOURS,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=self.dropoff_loc.name,
            end_location=self.dropoff_loc.name,
            start_lat=self.dropoff_loc.latitude,
            start_lng=self.dropoff_loc.longitude,
            end_lat=self.dropoff_loc.latitude,
            end_lng=self.dropoff_loc.longitude,
            reason="Cargo dropoff and unloading at consignee",
            notes="1 hour On Duty (Not Driving).",
        )
        self.timeline.append(event)

        self.hos.apply_on_duty_not_driving(DROPOFF_DURATION_HOURS)
        self.current_time = end_time

    def _insert_30_min_break(self, reason: str) -> None:
        """Insert 30-minute off-duty rest break."""
        lat, lng, city, state, loc_str = self._get_location_info_at_mile(self.current_trip_mile)
        start_time = self.current_time
        end_time = start_time + timedelta(hours=MANDATORY_DRIVING_BREAK_HOURS)

        stop = Stop(
            stop_id=f"stop-{self.stop_counter}",
            type=StopType.REST_30,
            title="30-Minute Rest Break",
            reason=reason,
            latitude=lat,
            longitude=lng,
            route_mile=self.current_trip_mile,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=MANDATORY_DRIVING_BREAK_HOURS,
            city=city,
            state=state,
            is_hos_required=True,
            satisfies_break=True,
            is_approximate=True,
        )
        self.stop_counter += 1
        self.stops.append(stop)

        event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.OFF_DUTY,
            activity_type="REST_30",
            start_time=start_time,
            end_time=end_time,
            duration_hours=MANDATORY_DRIVING_BREAK_HOURS,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=loc_str,
            end_location=loc_str,
            start_lat=lat,
            start_lng=lng,
            end_lat=lat,
            end_lng=lng,
            reason=reason,
            notes="Off Duty break. Resets 8-hour cumulative driving limit. Does not pause 14-hour window.",
        )
        self.timeline.append(event)

        self.hos.apply_off_duty(MANDATORY_DRIVING_BREAK_HOURS)
        self.current_time = end_time

    def _insert_daily_reset(self, reason: str) -> None:
        """Insert 10-hour consecutive off-duty rest period."""
        lat, lng, city, state, loc_str = self._get_location_info_at_mile(self.current_trip_mile)
        start_time = self.current_time
        end_time = start_time + timedelta(hours=DAILY_RESTART_HOURS)

        stop = Stop(
            stop_id=f"stop-{self.stop_counter}",
            type=StopType.REST_10,
            title="10-Hour Off-Duty Reset",
            reason=reason,
            latitude=lat,
            longitude=lng,
            route_mile=self.current_trip_mile,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=DAILY_RESTART_HOURS,
            city=city,
            state=state,
            is_hos_required=True,
            satisfies_daily_reset=True,
            satisfies_break=True,
            is_approximate=True,
        )
        self.stop_counter += 1
        self.stops.append(stop)

        event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.OFF_DUTY,
            activity_type="REST_10",
            start_time=start_time,
            end_time=end_time,
            duration_hours=DAILY_RESTART_HOURS,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=loc_str,
            end_location=loc_str,
            start_lat=lat,
            start_lng=lng,
            end_lat=lat,
            end_lng=lng,
            reason=reason,
            notes="10 consecutive hours Off Duty. Resets 11-hour driving and 14-hour window clocks.",
        )
        self.timeline.append(event)

        self.hos.apply_off_duty(DAILY_RESTART_HOURS)
        self.current_time = end_time

    def _insert_cycle_restart(self, reason: str) -> None:
        """Insert 34-hour consecutive off-duty cycle restart."""
        lat, lng, city, state, loc_str = self._get_location_info_at_mile(self.current_trip_mile)
        start_time = self.current_time
        end_time = start_time + timedelta(hours=CYCLE_RESTART_HOURS)

        stop = Stop(
            stop_id=f"stop-{self.stop_counter}",
            type=StopType.RESTART_34,
            title="34-Hour Cycle Restart",
            reason=reason,
            latitude=lat,
            longitude=lng,
            route_mile=self.current_trip_mile,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=CYCLE_RESTART_HOURS,
            city=city,
            state=state,
            is_hos_required=True,
            satisfies_cycle_restart=True,
            satisfies_daily_reset=True,
            satisfies_break=True,
            is_approximate=True,
        )
        self.stop_counter += 1
        self.stops.append(stop)

        event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.OFF_DUTY,
            activity_type="RESTART_34",
            start_time=start_time,
            end_time=end_time,
            duration_hours=CYCLE_RESTART_HOURS,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=loc_str,
            end_location=loc_str,
            start_lat=lat,
            start_lng=lng,
            end_lat=lat,
            end_lng=lng,
            reason=reason,
            notes="34 consecutive hours Off Duty. Resets 70/8 cycle to 0 hours used.",
        )
        self.timeline.append(event)

        self.hos.apply_off_duty(CYCLE_RESTART_HOURS)
        self.current_time = end_time

    def _insert_fuel_stop(self, reason: str, satisfies_break: bool = True) -> None:
        """Insert 30-minute on-duty fuel stop."""
        lat, lng, city, state, loc_str = self._get_location_info_at_mile(self.current_trip_mile)
        start_time = self.current_time
        end_time = start_time + timedelta(hours=DEFAULT_FUEL_DURATION_HOURS)

        stop = Stop(
            stop_id=f"stop-{self.stop_counter}",
            type=StopType.FUEL,
            title="Planned Fuel Stop",
            reason=reason,
            latitude=lat,
            longitude=lng,
            route_mile=self.current_trip_mile,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=DEFAULT_FUEL_DURATION_HOURS,
            city=city,
            state=state,
            is_hos_required=True,
            satisfies_break=satisfies_break,
            is_approximate=True,
        )
        self.stop_counter += 1
        self.stops.append(stop)

        event = TimelineEvent(
            event_id=f"event-{len(self.timeline) + 1}",
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            activity_type="FUEL",
            start_time=start_time,
            end_time=end_time,
            duration_hours=DEFAULT_FUEL_DURATION_HOURS,
            start_mile=self.current_trip_mile,
            end_mile=self.current_trip_mile,
            start_location=loc_str,
            end_location=loc_str,
            start_lat=lat,
            start_lng=lng,
            end_lat=lat,
            end_lng=lng,
            reason=reason,
            notes=f"Refueling stop ({round(DEFAULT_FUEL_DURATION_HOURS * 60)} min On Duty). Resets 1,000-mile fuel interval.",
        )
        self.timeline.append(event)

        self.hos.apply_on_duty_not_driving(DEFAULT_FUEL_DURATION_HOURS)
        self.current_time = end_time
        self.cumulative_miles_since_fuel = 0.0
