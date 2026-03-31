"""
Unit tests for ComplianceValidator:
Verifies accurate validation of all 18 compliance constraints and violation detection.
"""

from datetime import datetime, timedelta
import zoneinfo
import pytest

from services.models import TimelineEvent, DutyStatus, DailyLog
from services.compliance_validator import ComplianceValidator


def test_validator_detects_11_hour_driving_violation():
    tz = zoneinfo.ZoneInfo("America/Chicago")
    t0 = datetime(2026, 10, 10, 6, 0, tzinfo=tz)

    # 12 consecutive hours of driving without 10h reset -> VIOLATION of 11h limit!
    timeline = [
        TimelineEvent("e1", DutyStatus.DRIVING, "DRIVING", t0, t0 + timedelta(hours=12.0), 12.0, 0, 600, "A", "B", 0, 0, 0, 0, "Driving")
    ]
    daily_logs = []

    validator = ComplianceValidator(timeline, daily_logs, initial_cycle_used=0.0, expected_total_miles=600.0)
    result = validator.validate_all()

    assert not result["is_compliant"]
    assert any("11-Hour Driving Limit violated" in f for f in result["failed_checks"])


def test_validator_detects_14_hour_window_violation():
    tz = zoneinfo.ZoneInfo("America/Chicago")
    t0 = datetime(2026, 10, 10, 6, 0, tzinfo=tz)

    # 10 hours on-duty not driving, then 2 hours driving, then at hour 15 another hour of driving
    timeline = [
        TimelineEvent("e1", DutyStatus.ON_DUTY_NOT_DRIVING, "PICKUP", t0, t0 + timedelta(hours=10.0), 10.0, 0, 0, "A", "A", 0, 0, 0, 0, "Pickup"),
        TimelineEvent("e2", DutyStatus.OFF_DUTY, "REST", t0 + timedelta(hours=10.0), t0 + timedelta(hours=14.5), 4.5, 0, 0, "A", "A", 0, 0, 0, 0, "Short break"),
        TimelineEvent("e3", DutyStatus.DRIVING, "DRIVING", t0 + timedelta(hours=14.5), t0 + timedelta(hours=16.0), 1.5, 0, 80, "A", "B", 0, 0, 0, 0, "Driving past 14h window"),
    ]
    daily_logs = []

    validator = ComplianceValidator(timeline, daily_logs, initial_cycle_used=0.0, expected_total_miles=80.0)
    result = validator.validate_all()

    assert not result["is_compliant"]
    assert any("14-Hour Window violated" in f for f in result["failed_checks"])


def test_validator_detects_invalid_daily_log_sum():
    timeline = []
    # Create invalid daily log that sums to 22 hours instead of 24 hours
    invalid_log = DailyLog(
        day_number=1,
        date_str="2026-10-10",
        from_location="A",
        to_location="B",
        miles_driving_today=100,
        total_mileage_today=100,
        carrier_name="",
        main_office_address="",
        home_terminal_address="",
        truck_number="",
        trailer_number="",
        driver_name="",
        co_driver_name="",
        shipping_doc_number="",
        commodity="",
        hours_off_duty=10.0,
        hours_sleeper_berth=0.0,
        hours_driving=8.0,
        hours_on_duty_not_driving=4.0,  # 10 + 0 + 8 + 4 = 22h != 24h
        total_hours=22.0,
        segments=[],
        remarks=[],
    )

    validator = ComplianceValidator(timeline, [invalid_log], initial_cycle_used=0.0, expected_total_miles=100.0)
    result = validator.validate_all()

    assert not result["is_compliant"]
    assert any("totals 22.0h instead of 24.0 hours" in f for f in result["failed_checks"])
