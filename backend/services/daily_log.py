"""
Daily Log Sheet Generator:
- Midnight partitioning in selected home-terminal timezone
- Exact 24.0-hour duty segment slicing (0 to 1440 minutes)
- Right-side category totals summing to exactly 24 hours
- Automatic remarks for every duty status change with time, city, state, activity
- Recap calculations for 70/8 compliance
"""

from datetime import datetime, timedelta, date, time as dt_time
import zoneinfo
import logging
from typing import List, Dict, Any, Optional

from .models import (
    TimelineEvent,
    DailyLog,
    DailySegment,
    DailyRemark,
    DailyRecap,
    DutyStatus,
)

logger = logging.getLogger(__name__)


def generate_daily_logs(
    timeline: List[TimelineEvent],
    timezone_str: str = "America/Chicago",
    carrier_name: str = "",
    main_office_address: str = "",
    home_terminal_address: str = "",
    truck_number: str = "",
    trailer_number: str = "",
    driver_name: str = "",
    co_driver_name: str = "",
    shipping_doc_number: str = "",
    commodity: str = "",
    initial_cycle_used: float = 0.0,
) -> List[DailyLog]:
    """
    Partitions the continuous timeline into discrete 24-hour calendar day log sheets.
    Each day runs from 00:00 to 24:00 (1440 minutes).
    """
    if not timeline:
        return []

    try:
        tz = zoneinfo.ZoneInfo(timezone_str)
    except Exception:
        logger.warning("Invalid timezone '%s', falling back to America/Chicago", timezone_str)
        tz = zoneinfo.ZoneInfo("America/Chicago")

    # Convert all timeline event timestamps to local timezone
    local_events: List[Dict[str, Any]] = []
    for e in timeline:
        if e.activity_type == "TRIP_COMPLETE":
            continue
        start_local = e.start_time.astimezone(tz) if e.start_time.tzinfo else e.start_time.replace(tzinfo=zoneinfo.ZoneInfo("UTC")).astimezone(tz)
        end_local = e.end_time.astimezone(tz) if e.end_time.tzinfo else e.end_time.replace(tzinfo=zoneinfo.ZoneInfo("UTC")).astimezone(tz)

        local_events.append({
            "event": e,
            "status": e.status,
            "activity_type": e.activity_type,
            "start": start_local,
            "end": end_local,
            "start_mile": e.start_mile,
            "end_mile": e.end_mile,
            "start_location": e.start_location,
            "end_location": e.end_location,
            "reason": e.reason,
        })

    if not local_events:
        return []

    first_dt = local_events[0]["start"]
    last_dt = local_events[-1]["end"]

    start_date = first_dt.date()
    end_date = last_dt.date()

    daily_logs: List[DailyLog] = []
    current_date = start_date
    day_number = 1
    cumulative_cycle = initial_cycle_used

    while current_date <= end_date:
        day_start = datetime.combine(current_date, dt_time.min, tzinfo=tz)
        day_end = datetime.combine(current_date, dt_time.max, tzinfo=tz)

        day_segments: List[DailySegment] = []
        day_remarks: List[DailyRemark] = []
        day_driving_miles = 0.0
        from_location = ""
        to_location = ""
        took_34_restart = False

        # Identify all events that overlap with this calendar day
        for item in local_events:
            e_start = item["start"]
            e_end = item["end"]

            # Check overlap
            if e_end <= day_start or e_start >= (day_start + timedelta(days=1)):
                continue

            # Slice event to bounds of current day
            overlap_start = max(e_start, day_start)
            overlap_end = min(e_end, day_start + timedelta(days=1))

            start_min = int(round((overlap_start - day_start).total_seconds() / 60.0))
            end_min = int(round((overlap_end - day_start).total_seconds() / 60.0))

            # Clamp to [0, 1440]
            start_min = max(0, min(1440, start_min))
            end_min = max(0, min(1440, end_min))

            dur_hours = (end_min - start_min) / 60.0
            if dur_hours <= 0.0:
                continue

            seg = DailySegment(
                status=item["status"],
                start_minute=start_min,
                end_minute=end_min,
                duration_hours=dur_hours,
                start_time_str=overlap_start.strftime("%H:%M"),
                end_time_str=overlap_end.strftime("%H:%M"),
            )
            day_segments.append(seg)

            # Mileage
            if item["status"] == DutyStatus.DRIVING:
                ev_dur = max(0.001, (e_end - e_start).total_seconds() / 3600.0)
                seg_ratio = dur_hours / ev_dur
                tot_ev_miles = item["end_mile"] - item["start_mile"]
                day_driving_miles += tot_ev_miles * seg_ratio

