"""
HOS Rule Engine for Property-Carrying Interstate Drivers (FMCSA April 2022).

Enforces:
- 11-hour driving limit
- 14-hour consecutive driving window
- 30-minute rest break after 8 cumulative driving hours
- 10-hour consecutive off-duty reset
- 70-hour / 8-day cycle limit
- 34-hour cycle restart
"""

from typing import Optional, Tuple
from .constants import (
    MAX_DRIVING_HOURS,
    MAX_WINDOW_HOURS,
    MANDATORY_DRIVING_BREAK_HOURS,
    DRIVING_BREAK_THRESHOLD_HOURS,
    DAILY_RESTART_HOURS,
    CYCLE_LIMIT_HOURS,
    CYCLE_RESTART_HOURS,
)
from .models import DutyStatus, HOSState


class HOSEngine:
    def __init__(self, initial_cycle_used: float = 0.0):
        # Validate initial cycle used (0.0 to 70.0)
        self.cycle_used: float = max(0.0, min(float(initial_cycle_used), CYCLE_LIMIT_HOURS))

        # Driving clocks
        self.driving_in_window: float = 0.0  # Max 11.0
        self.window_elapsed: float = 0.0     # Max 14.0 consecutive from on-duty start
        self.driving_since_break: float = 0.0  # Max 8.0 before 30-min break
        self.window_active: bool = False      # Starts when driver goes on-duty

        # Consecutive off-duty tracking for resets
        self.consecutive_off_duty: float = 0.0

    @property
    def cycle_remaining(self) -> float:
        return max(0.0, CYCLE_LIMIT_HOURS - self.cycle_used)

    @property
    def driving_remaining_in_window(self) -> float:
        return max(0.0, MAX_DRIVING_HOURS - self.driving_in_window)

    @property
    def window_remaining(self) -> float:
        if not self.window_active:
            return MAX_WINDOW_HOURS
        return max(0.0, MAX_WINDOW_HOURS - self.window_elapsed)

    @property
    def driving_until_break(self) -> float:
        return max(0.0, DRIVING_BREAK_THRESHOLD_HOURS - self.driving_since_break)

    def get_hos_state(self, current_location: str = "", current_mile: float = 0.0) -> HOSState:
        return HOSState(
            cycle_used=self.cycle_used,
            cycle_remaining=self.cycle_remaining,
            driving_used_in_current_window=self.driving_in_window,
            driving_remaining_in_current_window=self.driving_remaining_in_window,
            window_elapsed=self.window_elapsed,
            window_remaining=self.window_remaining,
            driving_since_30_min_break=self.driving_since_break,
            current_location=current_location,
            current_route_mile=current_mile,
        )

    def max_continuous_driving_allowed(self) -> float:
        """
        Determines the maximum number of driving hours the driver can legally perform right now
        before an HOS limit (break, 11h driving, 14h window, or 70h cycle) is reached.
        """
        limit_11 = self.driving_remaining_in_window
        limit_14 = self.window_remaining
        limit_break = self.driving_until_break
        limit_cycle = self.cycle_remaining

        allowed = min(limit_11, limit_14, limit_break, limit_cycle)
        return max(0.0, allowed)

    def which_limit_binds(self) -> str:
        """Identifies which HOS rule is currently the binding constraint for driving."""
        limit_11 = self.driving_remaining_in_window
        limit_14 = self.window_remaining
        limit_break = self.driving_until_break
        limit_cycle = self.cycle_remaining

        min_val = min(limit_11, limit_14, limit_break, limit_cycle)
        if min_val == limit_cycle:
            return "CYCLE_70"
        if min_val == limit_11:
            return "DRIVING_11"
        if min_val == limit_14:
            return "WINDOW_14"
        return "REST_30_BREAK"

    def apply_driving(self, duration_hours: float) -> None:
        """Apply driving time to clocks."""
        if duration_hours <= 0:
            return

        self.window_active = True
        self.consecutive_off_duty = 0.0

        self.driving_in_window += duration_hours
        self.window_elapsed += duration_hours
        self.driving_since_break += duration_hours
        self.cycle_used += duration_hours

    def apply_on_duty_not_driving(self, duration_hours: float) -> None:
        """
        Apply On-Duty Not Driving activity (e.g. Pickup, Dropoff, Fueling).
        Counts toward 14-hour window and 70-hour cycle.
        If duration >= 0.5 hours (30 mins), it qualifies as a 30-minute break!
        """
        if duration_hours <= 0:
            return

        self.window_active = True
        self.consecutive_off_duty = 0.0

        self.window_elapsed += duration_hours
        self.cycle_used += duration_hours

        # 30-minute break can be satisfied by on-duty not driving
        if duration_hours >= MANDATORY_DRIVING_BREAK_HOURS:
            self.driving_since_break = 0.0

    def apply_off_duty(self, duration_hours: float) -> None:
        """
        Apply Off-Duty or Sleeper Berth period.
        Does NOT count toward cycle.
        If >= 0.5 hours, satisfies 30-minute break.
        If >= 10.0 hours, satisfies daily reset (resets 11h and 14h clocks).
        If >= 34.0 hours, satisfies 34-hour cycle restart (resets cycle to 0 and daily clocks).
        If < 10.0 hours, it does NOT pause or extend the 14-hour window if window is active!
        """
        if duration_hours <= 0:
            return

        self.consecutive_off_duty += duration_hours

        # 34-Hour Restart check
        if duration_hours >= CYCLE_RESTART_HOURS or self.consecutive_off_duty >= CYCLE_RESTART_HOURS:
            self.cycle_used = 0.0
            self.driving_in_window = 0.0
            self.window_elapsed = 0.0
            self.driving_since_break = 0.0
            self.window_active = False
            return

        # 10-Hour Daily Reset check
        if duration_hours >= DAILY_RESTART_HOURS or self.consecutive_off_duty >= DAILY_RESTART_HOURS:
            self.driving_in_window = 0.0
            self.window_elapsed = 0.0
            self.driving_since_break = 0.0
            self.window_active = False
            return

        # Consecutive 30-minute rest break check
        if duration_hours >= MANDATORY_DRIVING_BREAK_HOURS:
            self.driving_since_break = 0.0

        # Short off-duty < 10 hours does NOT pause the 14-hour window
        if self.window_active:
            self.window_elapsed += duration_hours
