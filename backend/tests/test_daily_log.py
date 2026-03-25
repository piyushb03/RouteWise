"""
Unit tests for DailyLog generator:
- Midnight interval partitioning
- 24.0-hour exact totals
- Remarks generation
- FMCSA guide reference day validation
"""

from datetime import datetime, timedelta
import zoneinfo
import pytest

from services.models import TimelineEvent, DutyStatus
from services.daily_log import generate_daily_logs


def test_single_day_schedule_totals_24_hours():
    tz = zoneinfo.ZoneInfo("America/Chicago")
    # Start at 06:00, drive 4h, pickup 1h, drive 4h, dropoff 1h, arrive 16:00
    t0 = datetime(2026, 10, 10, 6, 0, tzinfo=tz)
    t1 = t0 + timedelta(hours=4.0)
    t2 = t1 + timedelta(hours=1.0)
    t3 = t2 + timedelta(hours=4.0)
    t4 = t3 + timedelta(hours=1.0)

    timeline = [
        TimelineEvent(
            event_id="e1", status=DutyStatus.DRIVING, activity_type="DRIVING",
            start_time=t0, end_time=t1, duration_hours=4.0,
            start_mile=0, end_mile=220, start_location="Dallas, TX", end_location="Waco, TX",
            start_lat=32.7, start_lng=-96.7, end_lat=31.5, end_lng=-97.1, reason="Driving to pickup"
        ),
        TimelineEvent(
            event_id="e2", status=DutyStatus.ON_DUTY_NOT_DRIVING, activity_type="PICKUP",
            start_time=t1, end_time=t2, duration_hours=1.0,
            start_mile=220, end_mile=220, start_location="Waco, TX", end_location="Waco, TX",
            start_lat=31.5, start_lng=-97.1, end_lat=31.5, end_lng=-97.1, reason="Pickup cargo"
        ),
        TimelineEvent(
            event_id="e3", status=DutyStatus.DRIVING, activity_type="DRIVING",
            start_time=t2, end_time=t3, duration_hours=4.0,
            start_mile=220, end_mile=440, start_location="Waco, TX", end_location="Austin, TX",
            start_lat=31.5, start_lng=-97.1, end_lat=30.2, end_lng=-97.7, reason="Driving to dropoff"
        ),
        TimelineEvent(
            event_id="e4", status=DutyStatus.ON_DUTY_NOT_DRIVING, activity_type="DROPOFF",
            start_time=t3, end_time=t4, duration_hours=1.0,
            start_mile=440, end_mile=440, start_location="Austin, TX", end_location="Austin, TX",
            start_lat=30.2, start_lng=-97.7, end_lat=30.2, end_lng=-97.7, reason="Dropoff cargo"
        ),
    ]

    logs = generate_daily_logs(timeline, timezone_str="America/Chicago")
    assert len(logs) == 1
    log = logs[0]

    # Driving: 4 + 4 = 8h
    # On duty not driving: 1 + 1 = 2h
    # Off duty: 00:00 to 06:00 (6h) + 16:00 to 24:00 (8h) = 14h
    # Total = 8 + 2 + 14 = 24.0h
    assert abs(log.hours_driving - 8.0) < 0.01
    assert abs(log.hours_on_duty_not_driving - 2.0) < 0.01
    assert abs(log.hours_off_duty - 14.0) < 0.01
    assert abs(log.total_hours - 24.0) < 0.01
    assert len(log.remarks) >= 4


def test_multi_day_midnight_partitioning():
    tz = zoneinfo.ZoneInfo("America/Chicago")
    # Event starts on Day 1 at 22:00 and ends on Day 2 at 04:00 (6 hours driving across midnight)
    t_start = datetime(2026, 10, 10, 22, 0, tzinfo=tz)
    t_end = datetime(2026, 10, 11, 4, 0, tzinfo=tz)

    timeline = [
        TimelineEvent(
            event_id="e1", status=DutyStatus.DRIVING, activity_type="DRIVING",
            start_time=t_start, end_time=t_end, duration_hours=6.0,
            start_mile=0, end_mile=330, start_location="Amarillo, TX", end_location="Albuquerque, NM",
            start_lat=35.2, start_lng=-101.8, end_lat=35.0, end_lng=-106.6, reason="Overnight interstate driving"
        )
    ]

    logs = generate_daily_logs(timeline, timezone_str="America/Chicago")
    assert len(logs) == 2

    # Day 1: 22:00 to 24:00 = 2 hours driving, 22 hours off duty = 24 hours
    log1 = logs[0]
    assert log1.date_str == "2026-10-10"
    assert abs(log1.hours_driving - 2.0) < 0.01
    assert abs(log1.hours_off_duty - 22.0) < 0.01
    assert abs(log1.total_hours - 24.0) < 0.01

    # Day 2: 00:00 to 04:00 = 4 hours driving, 20 hours off duty = 24 hours
    log2 = logs[1]
    assert log2.date_str == "2026-10-11"
    assert abs(log2.hours_driving - 4.0) < 0.01
    assert abs(log2.hours_off_duty - 20.0) < 0.01
    assert abs(log2.total_hours - 24.0) < 0.01


def test_fmcsa_guide_example_fixture():
    """
    Validates a typical full day matching the FMCSA Interstate Truck Driver's Guide example:
    - 06:00-07:00: On-duty pre-trip inspection (1h)
    - 07:00-11:30: Driving (4.5h)
    - 11:30-12:00: Off-duty 30-min break (0.5h)
    - 12:00-16:30: Driving (4.5h)
    - 16:30-17:30: On-duty unloading (1h)
    - 17:30-24:00: Off-duty rest (6.5h)
    """
    tz = zoneinfo.ZoneInfo("America/New_York")
    base = datetime(2026, 4, 15, 6, 0, tzinfo=tz)

    timeline = [
        TimelineEvent("e1", DutyStatus.ON_DUTY_NOT_DRIVING, "INSPECTION", base, base + timedelta(hours=1), 1.0, 0, 0, "Richmond, VA", "Richmond, VA", 37.5, -77.4, 37.5, -77.4, "Pre-trip inspection"),
        TimelineEvent("e2", DutyStatus.DRIVING, "DRIVING", base + timedelta(hours=1), base + timedelta(hours=5.5), 4.5, 0, 250, "Richmond, VA", "Florence, SC", 37.5, -77.4, 34.2, -79.7, "Interstate driving"),
        TimelineEvent("e3", DutyStatus.OFF_DUTY, "REST_30", base + timedelta(hours=5.5), base + timedelta(hours=6.0), 0.5, 250, 250, "Florence, SC", "Florence, SC", 34.2, -79.7, 34.2, -79.7, "30-minute meal break"),
        TimelineEvent("e4", DutyStatus.DRIVING, "DRIVING", base + timedelta(hours=6.0), base + timedelta(hours=10.5), 4.5, 250, 500, "Florence, SC", "Savannah, GA", 34.2, -79.7, 32.0, -81.0, "Interstate driving"),
        TimelineEvent("e5", DutyStatus.ON_DUTY_NOT_DRIVING, "DROPOFF", base + timedelta(hours=10.5), base + timedelta(hours=11.5), 1.0, 500, 500, "Savannah, GA", "Savannah, GA", 32.0, -81.0, 32.0, -81.0, "Unload shipment"),
    ]

    logs = generate_daily_logs(timeline, timezone_str="America/New_York")
    assert len(logs) == 1
    log = logs[0]

    assert abs(log.hours_driving - 9.0) < 0.01  # 4.5 + 4.5
    assert abs(log.hours_on_duty_not_driving - 2.0) < 0.01  # 1.0 + 1.0
    assert abs(log.hours_off_duty - 13.0) < 0.01  # 6h before 06:00 + 0.5h break + 6.5h after 17:30
    assert abs(log.total_hours - 24.0) < 0.01
