"""
Domain models and dataclasses for RouteWise HOS Planner.
Strong typing for locations, routes, HOS states, stops, timeline events, and daily logs.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any


class DutyStatus(str, Enum):
    OFF_DUTY = "OFF_DUTY"
    SLEEPER_BERTH = "SLEEPER_BERTH"
    DRIVING = "DRIVING"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"

    @property
    def is_on_duty(self) -> bool:
        return self in (DutyStatus.DRIVING, DutyStatus.ON_DUTY_NOT_DRIVING)

    @property
    def grid_row_index(self) -> int:
        """1: Off Duty, 2: Sleeper Berth, 3: Driving, 4: On Duty (Not Driving)"""
        return {
            DutyStatus.OFF_DUTY: 1,
            DutyStatus.SLEEPER_BERTH: 2,
            DutyStatus.DRIVING: 3,
            DutyStatus.ON_DUTY_NOT_DRIVING: 4,
        }[self]

    @property
    def display_name(self) -> str:
        return {
            DutyStatus.OFF_DUTY: "Off Duty",
            DutyStatus.SLEEPER_BERTH: "Sleeper Berth",
            DutyStatus.DRIVING: "Driving",
            DutyStatus.ON_DUTY_NOT_DRIVING: "On Duty (Not Driving)",
        }[self]


class StopType(str, Enum):
    START = "START"
    PICKUP = "PICKUP"
    DROPOFF = "DROPOFF"
    FUEL = "FUEL"
    REST_30 = "REST_30"
    REST_10 = "REST_10"
    RESTART_34 = "RESTART_34"


@dataclass
class Location:
    name: str
    formatted_address: str
    latitude: float
    longitude: float
    city: str = ""
    state: str = ""
    country: str = "US"
    source: str = "nominatim"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RouteStep:
    instruction: str
    distance_miles: float
    duration_seconds: float
    name: str = ""
    maneuver_type: str = ""
    latitude: float = 0.0
    longitude: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RouteLeg:
    leg_id: str
    origin: Location
    destination: Location
    distance_miles: float
    duration_seconds: float
    steps: List[RouteStep] = field(default_factory=list)
    geometry_coords: List[List[float]] = field(default_factory=list)  # [[lat, lng], ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "leg_id": self.leg_id,
            "origin": self.origin.to_dict(),
            "destination": self.destination.to_dict(),
            "distance_miles": round(self.distance_miles, 2),
            "duration_seconds": self.duration_seconds,
            "steps": [s.to_dict() for s in self.steps],
            "geometry_coords": self.geometry_coords,
        }


@dataclass
class Stop:
    stop_id: str
    type: StopType
    title: str
    reason: str
    latitude: float
    longitude: float
    route_mile: float
    start_time: str
    end_time: str
    duration_hours: float
    city: str = ""
    state: str = ""
    is_hos_required: bool = True
    satisfies_break: bool = False
    satisfies_daily_reset: bool = False
    satisfies_cycle_restart: bool = False
    is_approximate: bool = False

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["type"] = self.type.value
        data["route_mile"] = round(self.route_mile, 1)
        data["duration_hours"] = round(self.duration_hours, 2)
        return data


@dataclass
class TimelineEvent:
    event_id: str
    status: DutyStatus
    activity_type: str
    start_time: datetime
    end_time: datetime
    duration_hours: float
    start_mile: float
    end_mile: float
    start_location: str
    end_location: str
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    reason: str
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "status": self.status.value,
            "activity_type": self.activity_type,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "duration_hours": round(self.duration_hours, 3),
            "start_mile": round(self.start_mile, 1),
            "end_mile": round(self.end_mile, 1),
            "start_location": self.start_location,
            "end_location": self.end_location,
            "start_lat": self.start_lat,
            "start_lng": self.start_lng,
            "end_lat": self.end_lat,
            "end_lng": self.end_lng,
            "reason": self.reason,
            "notes": self.notes,
        }


@dataclass
class HOSState:
    cycle_used: float
    cycle_remaining: float
    driving_used_in_current_window: float
    driving_remaining_in_current_window: float
    window_elapsed: float
    window_remaining: float
    driving_since_30_min_break: float
    current_location: str = ""
    current_route_mile: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cycle_used": round(self.cycle_used, 2),
            "cycle_remaining": round(self.cycle_remaining, 2),
            "driving_used_in_current_window": round(self.driving_used_in_current_window, 2),
            "driving_remaining_in_current_window": round(self.driving_remaining_in_current_window, 2),
            "window_elapsed": round(self.window_elapsed, 2),
            "window_remaining": round(self.window_remaining, 2),
            "driving_since_30_min_break": round(self.driving_since_30_min_break, 2),
            "current_location": self.current_location,
            "current_route_mile": round(self.current_route_mile, 1),
        }


@dataclass
class DailySegment:
    status: DutyStatus
    start_minute: int  # 0 to 1440
    end_minute: int    # 0 to 1440
    duration_hours: float
    start_time_str: str
    end_time_str: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "grid_row_index": self.status.grid_row_index,
            "start_minute": self.start_minute,
            "end_minute": self.end_minute,
            "duration_hours": round(self.duration_hours, 3),
            "start_time_str": self.start_time_str,
            "end_time_str": self.end_time_str,
        }


@dataclass
class DailyRemark:
    time_str: str
    location_str: str
    status: DutyStatus
    activity: str
    mile: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "time_str": self.time_str,
            "location_str": self.location_str,
            "status": self.status.value,
            "activity": self.activity,
            "mile": round(self.mile, 1),
        }


@dataclass
class DailyRecap:
    on_duty_today: float  # Lines 3 + 4
    total_hours_last_7_days: float  # A
    hours_available_tomorrow: float  # B = 70 - A
    total_hours_last_8_days: float  # C
    took_34_restart: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "on_duty_today": round(self.on_duty_today, 2),
            "total_hours_last_7_days": round(self.total_hours_last_7_days, 2),
            "hours_available_tomorrow": round(self.hours_available_tomorrow, 2),
            "total_hours_last_8_days": round(self.total_hours_last_8_days, 2),
            "took_34_restart": self.took_34_restart,
        }


@dataclass
class DailyLog:
    day_number: int
    date_str: str  # YYYY-MM-DD
    from_location: str
    to_location: str
    miles_driving_today: float
    total_mileage_today: float
    carrier_name: str
    main_office_address: str
    home_terminal_address: str
    truck_number: str
    trailer_number: str
    driver_name: str
    co_driver_name: str
    shipping_doc_number: str
    commodity: str
    hours_off_duty: float
    hours_sleeper_berth: float
    hours_driving: float
    hours_on_duty_not_driving: float
    total_hours: float
    segments: List[DailySegment] = field(default_factory=list)
    remarks: List[DailyRemark] = field(default_factory=list)
    recap: Optional[DailyRecap] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "day_number": self.day_number,
            "date_str": self.date_str,
            "from_location": self.from_location,
            "to_location": self.to_location,
            "miles_driving_today": round(self.miles_driving_today, 1),
            "total_mileage_today": round(self.total_mileage_today, 1),
            "carrier_name": self.carrier_name,
            "main_office_address": self.main_office_address,
            "home_terminal_address": self.home_terminal_address,
            "truck_number": self.truck_number,
            "trailer_number": self.trailer_number,
            "driver_name": self.driver_name,
            "co_driver_name": self.co_driver_name,
            "shipping_doc_number": self.shipping_doc_number,
            "commodity": self.commodity,
            "hours_off_duty": round(self.hours_off_duty, 2),
            "hours_sleeper_berth": round(self.hours_sleeper_berth, 2),
            "hours_driving": round(self.hours_driving, 2),
            "hours_on_duty_not_driving": round(self.hours_on_duty_not_driving, 2),
            "total_hours": round(self.total_hours, 2),
            "segments": [s.to_dict() for s in self.segments],
            "remarks": [r.to_dict() for r in self.remarks],
            "recap": self.recap.to_dict() if self.recap else None,
        }
