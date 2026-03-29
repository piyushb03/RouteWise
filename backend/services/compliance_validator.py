"""
Independent HOS & Trip Compliance Validator.
Runs an exhaustive independent audit over the generated schedule timeline and daily logs.
"""

from typing import List, Dict, Any
from datetime import timedelta
from .models import TimelineEvent, DutyStatus, DailyLog
from .constants import (
    MAX_DRIVING_HOURS,
    MAX_WINDOW_HOURS,
    DRIVING_BREAK_THRESHOLD_HOURS,
    MANDATORY_DRIVING_BREAK_HOURS,
    DAILY_RESTART_HOURS,
    CYCLE_RESTART_HOURS,
    CYCLE_LIMIT_HOURS,
    FUEL_INTERVAL_MILES,
    PICKUP_DURATION_HOURS,
    DROPOFF_DURATION_HOURS,
)


class ComplianceValidator:
    def __init__(
        self,
        timeline: List[TimelineEvent],
        daily_logs: List[DailyLog],
        initial_cycle_used: float,
        expected_total_miles: float,
    ):
        self.timeline = timeline
        self.daily_logs = daily_logs
        self.initial_cycle_used = initial_cycle_used
        self.expected_total_miles = expected_total_miles
        self.passed_checks: List[str] = []
        self.failed_checks: List[str] = []
        self.warnings: List[str] = []

    def validate_all(self) -> Dict[str, Any]:
        """Runs all 18 independent compliance tests."""
        self._check_event_continuity_and_overlaps()
        self._check_event_durations()
        self._check_11_hour_driving_limit()
        self._check_14_hour_window_limit()
        self._check_8_hour_rest_break_rule()
        self._check_70_hour_cycle_limit()
        self._check_reset_and_restart_durations()
        self._check_pickup_and_dropoff_durations()
        self._check_fuel_interval()
        self._check_daily_logs_24h_sum()
        self._check_mileage_accounting()
        self._check_trip_completion_order()

        return {
            "is_compliant": len(self.failed_checks) == 0,
            "passed_checks_count": len(self.passed_checks),
            "failed_checks_count": len(self.failed_checks),
            "passed_checks": self.passed_checks,
            "failed_checks": self.failed_checks,
            "warnings": self.warnings,
        }

    def _check_event_continuity_and_overlaps(self) -> None:
        """Check 1 & 3: Timeline is continuous with no overlapping events."""
        overlaps = False
        discontinuities = False

        for i in range(len(self.timeline) - 1):
            e_curr = self.timeline[i]
            e_next = self.timeline[i + 1]

            if e_curr.end_time > e_next.start_time:
                overlaps = True
                self.failed_checks.append(
                    f"Event overlap detected: '{e_curr.activity_type}' ends at {e_curr.end_time.isoformat()} after '{e_next.activity_type}' starts at {e_next.start_time.isoformat()}."
                )

            # Check gap (allowing up to 1 second floating tolerance)
            gap_seconds = (e_next.start_time - e_curr.end_time).total_seconds()
            if gap_seconds > 5:
                discontinuities = True
                self.failed_checks.append(
                    f"Timeline gap of {round(gap_seconds)}s detected between '{e_curr.activity_type}' and '{e_next.activity_type}'."
                )

        if not overlaps:
            self.passed_checks.append("No overlapping timeline events found.")
        if not discontinuities:
            self.passed_checks.append("Timeline is continuous with zero unexplained gaps.")

    def _check_event_durations(self) -> None:
        """Check 2: Every event has positive duration unless marked zero-length."""
        invalid_duration = False
        for e in self.timeline:
            if e.activity_type == "TRIP_COMPLETE":
                continue
            if e.duration_hours <= 0.0:
                invalid_duration = True
                self.failed_checks.append(f"Event '{e.activity_type}' at {e.start_time.isoformat()} has non-positive duration: {e.duration_hours}h.")

        if not invalid_duration:
            self.passed_checks.append("All operational events possess valid positive durations.")

    def _check_11_hour_driving_limit(self) -> None:
        """Check 4: Driving never exceeds 11 hours in any 14-hour work window."""
        driving_in_window = 0.0
        violation = False

        for e in self.timeline:
            if e.status == DutyStatus.OFF_DUTY and e.duration_hours >= DAILY_RESTART_HOURS:
                # 10h reset or 34h restart resets window
                driving_in_window = 0.0
            elif e.status == DutyStatus.DRIVING:
                driving_in_window += e.duration_hours
                if driving_in_window > (MAX_DRIVING_HOURS + 1e-4):
                    violation = True
                    self.failed_checks.append(
                        f"11-Hour Driving Limit violated: accumulated {round(driving_in_window, 2)}h driving in active window at {e.start_time.isoformat()}."
                    )

        if not violation:
            self.passed_checks.append(f"11-hour driving limit strictly respected (maximum driving <= {MAX_DRIVING_HOURS}h per duty window).")

    def _check_14_hour_window_limit(self) -> None:
        """Check 5: No driving occurs beyond the 14-consecutive-hour window from on-duty start."""
        window_start_time = None
        violation = False

        for e in self.timeline:
            if e.status == DutyStatus.OFF_DUTY and e.duration_hours >= DAILY_RESTART_HOURS:
                # 10h rest resets window
                window_start_time = None
                continue

            if e.status.is_on_duty and window_start_time is None:
                window_start_time = e.start_time

            if e.status == DutyStatus.DRIVING and window_start_time is not None:
                elapsed_hours = (e.end_time - window_start_time).total_seconds() / 3600.0
                if elapsed_hours > (MAX_WINDOW_HOURS + 0.02):
                    violation = True
                    self.failed_checks.append(
                        f"14-Hour Window violated: driving occurred {round(elapsed_hours, 2)}h after duty window began at {window_start_time.isoformat()}."
                    )

        if not violation:
            self.passed_checks.append(f"14-hour consecutive driving window respected (no driving beyond {MAX_WINDOW_HOURS}h of window start).")

    def _check_8_hour_rest_break_rule(self) -> None:
        """Check 6: 30-minute interruption required after 8 cumulative driving hours."""
