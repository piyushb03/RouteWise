"""
Unit tests for HOSEngine:
- 11-hour driving limit
- 14-hour window limit
- 30-minute rest break after 8 cumulative driving hours
- 10-hour daily reset
- 70-hour cycle and 34-hour restart
"""

import pytest
from services.hos_engine import HOSEngine
from services.constants import (
    MAX_DRIVING_HOURS,
    MAX_WINDOW_HOURS,
    DAILY_RESTART_HOURS,
    CYCLE_LIMIT_HOURS,
    CYCLE_RESTART_HOURS,
)


def test_initial_state():
    hos = HOSEngine(initial_cycle_used=10.0)
    assert hos.cycle_used == 10.0
    assert hos.cycle_remaining == 60.0
    assert hos.driving_remaining_in_window == 11.0
    assert hos.window_remaining == 14.0
    assert hos.driving_until_break == 8.0
    assert hos.max_continuous_driving_allowed() == 8.0  # 8h break is binding


def test_driving_advances_clocks():
    hos = HOSEngine(initial_cycle_used=0.0)
    hos.apply_driving(5.0)

    assert hos.driving_in_window == 5.0
    assert hos.window_elapsed == 5.0
    assert hos.driving_since_break == 5.0
    assert hos.cycle_used == 5.0
    assert hos.driving_remaining_in_window == 6.0
    assert hos.window_remaining == 9.0
    assert hos.driving_until_break == 3.0
    assert hos.max_continuous_driving_allowed() == 3.0


def test_30_minute_break_resets_break_clock():
    hos = HOSEngine(initial_cycle_used=0.0)
    hos.apply_driving(8.0)
    assert hos.driving_until_break == 0.0
    assert hos.which_limit_binds() == "REST_30_BREAK"

    # Take 30-minute off-duty break
    hos.apply_off_duty(0.5)
    assert hos.driving_since_break == 0.0
    assert hos.driving_until_break == 8.0
    # Window does NOT pause during 30m break: window elapsed is now 8.0 + 0.5 = 8.5
    assert hos.window_elapsed == 8.5
    assert hos.window_remaining == 5.5
    # Driving remaining is 11 - 8 = 3.0, window is 5.5 -> 3.0 driving remaining binds
    assert hos.max_continuous_driving_allowed() == 3.0
    assert hos.which_limit_binds() == "DRIVING_11"


def test_on_duty_not_driving_satisfies_break():
    hos = HOSEngine(initial_cycle_used=0.0)
    hos.apply_driving(7.0)

    # 1 hour pickup satisfies 30m break requirement
    hos.apply_on_duty_not_driving(1.0)
    assert hos.driving_since_break == 0.0
    assert hos.driving_until_break == 8.0
    assert hos.cycle_used == 8.0
    assert hos.window_elapsed == 8.0


def test_10_hour_reset_restores_11_and_14():
    hos = HOSEngine(initial_cycle_used=10.0)
    hos.apply_driving(11.0)  # Reached 11h driving limit
    assert hos.driving_remaining_in_window == 0.0
    assert hos.max_continuous_driving_allowed() == 0.0

    # Apply 10-hour off-duty reset
    hos.apply_off_duty(10.0)
    assert hos.driving_in_window == 0.0
    assert hos.window_elapsed == 0.0
    assert hos.driving_since_break == 0.0
    assert hos.driving_remaining_in_window == 11.0
    assert hos.window_remaining == 14.0
    # Cycle was 10 + 11 = 21, 10h rest does NOT reset cycle
    assert hos.cycle_used == 21.0


def test_34_hour_restart_resets_cycle_to_zero():
    hos = HOSEngine(initial_cycle_used=65.0)
    hos.apply_driving(4.0)
    assert hos.cycle_used == 69.0
    assert hos.cycle_remaining == 1.0

    # 34-hour restart
    hos.apply_off_duty(34.0)
    assert hos.cycle_used == 0.0
    assert hos.cycle_remaining == 70.0
    assert hos.driving_in_window == 0.0
    assert hos.window_elapsed == 0.0
    assert hos.driving_remaining_in_window == 11.0
    assert hos.window_remaining == 14.0


def test_14_hour_window_expires_with_on_duty_time():
    hos = HOSEngine(initial_cycle_used=0.0)
    hos.apply_on_duty_not_driving(10.0)
    hos.apply_driving(4.0)  # Window is now 14.0 hours
    assert hos.window_remaining == 0.0
    assert hos.max_continuous_driving_allowed() == 0.0
    assert hos.which_limit_binds() == "WINDOW_14"
