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

