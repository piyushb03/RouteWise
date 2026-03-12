"""
Constants for FMCSA Property-Carrying Hours of Service (HOS) and Trip Planning.

Reference:
FMCSA Interstate Truck Driver's Guide to Hours of Service for Property Carriers, April 2022.
Assessment Specification: Interstate Truck Driver Planning and ELD Log Sheet Generator.

Clear distinction between FMCSA Regulatory Rules vs. Assessment Planning Assumptions is maintained.
"""

# ==============================================================================
# FMCSA REGULATORY RULES (49 CFR Part 395 - Property-Carrying Vehicles)
# ==============================================================================

# 11-Hour Driving Limit:
# May drive a maximum of 11 hours after 10 consecutive hours off duty.
MAX_DRIVING_HOURS: float = 11.0

# 14-Hour Driving Window:
# May not drive beyond the 14th consecutive hour after coming on duty,
# following 10 consecutive hours off duty. Does not pause for breaks or off-duty periods.
MAX_WINDOW_HOURS: float = 14.0

# 30-Minute Rest Break:
# Driving is not permitted if more than 8 hours of cumulative driving time
# have passed without at least a consecutive 30-minute interruption in driving status.
# Can be satisfied by Off-Duty, Sleeper Berth, or On-Duty (Not Driving).
MANDATORY_DRIVING_BREAK_HOURS: float = 0.5
DRIVING_BREAK_THRESHOLD_HOURS: float = 8.0

# 10-Hour Daily Rest / Reset:
# Must take at least 10 consecutive hours off duty before driving again
# to reset both the 11-hour driving and 14-hour window clocks.
DAILY_RESTART_HOURS: float = 10.0

# 70-Hour / 8-Day Cycle Limit:
# May not drive after 70 hours on duty in any 8 consecutive days.
# On-duty includes Driving and On-Duty (Not Driving).
CYCLE_LIMIT_HOURS: float = 70.0
CYCLE_DAYS: int = 8

# 34-Hour Restart:
# Any period of 34 or more consecutive hours off duty or in the sleeper berth
# restarts the 70-hour / 8-day rolling calculation back to 0 hours used.
CYCLE_RESTART_HOURS: float = 34.0


# ==============================================================================
# ASSESSMENT PLANNING ASSUMPTIONS (Supplied in project specification)
# Note: These are specific assessment parameters, not statutory regulations.
# ==============================================================================

# Fueling Requirement:
# Vehicle must be refueled at least once every 1,000 cumulative miles.
FUEL_INTERVAL_MILES: float = 1000.0

# Loading / Unloading Durations:
# 1 hour On-Duty (Not Driving) allocated for pickup and dropoff activities.
PICKUP_DURATION_HOURS: float = 1.0
DROPOFF_DURATION_HOURS: float = 1.0

# Operational Stop Assumptions:
# 30 minutes On-Duty (Not Driving) allocated for each fuel stop.
DEFAULT_FUEL_DURATION_HOURS: float = 0.5

# Default Trip Start Time (Local):
# 06:00 is used when the user leaves trip start time blank (aligned with FMCSA guide examples).
DEFAULT_START_TIME: str = "06:00"

# Average commercial truck speed default fallback if provider speed is absent (mph)
DEFAULT_TRUCK_AVERAGE_SPEED_MPH: float = 55.0

# Distance conversion factor: meters to miles
METERS_TO_MILES: float = 0.000621371
MILES_TO_METERS: float = 1609.34
