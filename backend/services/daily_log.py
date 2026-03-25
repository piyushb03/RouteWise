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

            # Locations
            if not from_location:
                from_location = item["start_location"]
            to_location = item["end_location"]

            # Remarks for transition if within this day
            if day_start <= e_start < (day_start + timedelta(days=1)):
                day_remarks.append(DailyRemark(
                    time_str=e_start.strftime("%H:%M"),
                    location_str=item["start_location"],
                    status=item["status"],
                    activity=item["reason"] or item["activity_type"],
                    mile=item["start_mile"],
                ))

            if item["activity_type"] == "RESTART_34":
                took_34_restart = True

        # Handle pre-trip and post-trip filling if day is not fully covered
        # E.g., before trip departure (driver was off-duty) and after trip arrival (driver off-duty)
        filled_segments = _normalize_and_fill_day(day_segments)

        # Sum daily totals
        off_duty_h = sum(s.duration_hours for s in filled_segments if s.status == DutyStatus.OFF_DUTY)
        sleeper_h = sum(s.duration_hours for s in filled_segments if s.status == DutyStatus.SLEEPER_BERTH)
        driving_h = sum(s.duration_hours for s in filled_segments if s.status == DutyStatus.DRIVING)
        on_duty_h = sum(s.duration_hours for s in filled_segments if s.status == DutyStatus.ON_DUTY_NOT_DRIVING)

        # Re-verify exact 24.00h sum
        total_h = off_duty_h + sleeper_h + driving_h + on_duty_h
        diff = 24.0 - total_h
        if abs(diff) > 0.001:
            off_duty_h += diff
            total_h = 24.0

        if not from_location and filled_segments:
            from_location = local_events[0]["start_location"] if local_events else "Terminal"
        if not to_location:
            to_location = from_location

        # Recap calculation
        on_duty_today = driving_h + on_duty_h
        if took_34_restart:
            cumulative_cycle = on_duty_today
        else:
            cumulative_cycle += on_duty_today

        last_7_days_total = min(70.0, cumulative_cycle)
        avail_tomorrow = max(0.0, 70.0 - last_7_days_total)
        last_8_days_total = cumulative_cycle

        recap = DailyRecap(
            on_duty_today=on_duty_today,
            total_hours_last_7_days=last_7_days_total,
            hours_available_tomorrow=avail_tomorrow,
            total_hours_last_8_days=last_8_days_total,
            took_34_restart=took_34_restart,
        )

        log = DailyLog(
            day_number=day_number,
            date_str=current_date.strftime("%Y-%m-%d"),
            from_location=from_location,
            to_location=to_location,
            miles_driving_today=day_driving_miles,
            total_mileage_today=day_driving_miles,
            carrier_name=carrier_name,
            main_office_address=main_office_address,
            home_terminal_address=home_terminal_address,
            truck_number=truck_number,
            trailer_number=trailer_number,
            driver_name=driver_name,
            co_driver_name=co_driver_name,
            shipping_doc_number=shipping_doc_number,
            commodity=commodity,
            hours_off_duty=off_duty_h,
            hours_sleeper_berth=sleeper_h,
            hours_driving=driving_h,
            hours_on_duty_not_driving=on_duty_h,
            total_hours=total_h,
            segments=filled_segments,
            remarks=day_remarks,
            recap=recap,
        )
        daily_logs.append(log)

        current_date += timedelta(days=1)
        day_number += 1

    return daily_logs


def _normalize_and_fill_day(segments: List[DailySegment]) -> List[DailySegment]:
    """
    Ensures continuous coverage of the entire 1440-minute day.
    Fills any leading or trailing unassigned intervals with OFF_DUTY.
    """
    if not segments:
        return [DailySegment(
            status=DutyStatus.OFF_DUTY,
            start_minute=0,
            end_minute=1440,
            duration_hours=24.0,
            start_time_str="00:00",
            end_time_str="24:00",
        )]

    sorted_segs = sorted(segments, key=lambda s: s.start_minute)
    filled: List[DailySegment] = []

    current_min = 0
    for seg in sorted_segs:
        if seg.start_minute > current_min:
            # Fill gap before this segment with OFF_DUTY
            filled.append(DailySegment(
                status=DutyStatus.OFF_DUTY,
                start_minute=current_min,
                end_minute=seg.start_minute,
                duration_hours=(seg.start_minute - current_min) / 60.0,
                start_time_str=f"{current_min // 60:02d}:{current_min % 60:02d}",
                end_time_str=f"{seg.start_minute // 60:02d}:{seg.start_minute % 60:02d}",
            ))
        filled.append(seg)
        current_min = seg.end_minute

    if current_min < 1440:
        # Fill remainder of day with OFF_DUTY
        filled.append(DailySegment(
            status=DutyStatus.OFF_DUTY,
            start_minute=current_min,
            end_minute=1440,
            duration_hours=(1440 - current_min) / 60.0,
            start_time_str=f"{current_min // 60:02d}:{current_min % 60:02d}",
            end_time_str="24:00",
        ))

    return filled
