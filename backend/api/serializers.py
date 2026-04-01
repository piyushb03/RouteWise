"""
DRF Serializers for RouteWise API requests and input validation.
"""

from rest_framework import serializers
import math


class LocationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=True)
    formatted_address = serializers.CharField(max_length=500, required=False, default="")
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0, required=True)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0, required=True)
    city = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    country = serializers.CharField(max_length=10, required=False, allow_blank=True, default="US")


class GeocodeRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=300, min_length=2, required=True)
    limit = serializers.IntegerField(min_value=1, max_value=10, default=5, required=False)


class ReverseGeocodeRequestSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0, required=True)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0, required=True)


class AdvancedDetailsSerializer(serializers.Serializer):
    driver_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    co_driver_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    carrier_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    carrier_address = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")
    home_terminal_address = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")
    truck_number = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    trailer_number = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    shipping_doc_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    commodity = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")


class TripPlanRequestSerializer(serializers.Serializer):
    current_location = LocationSerializer(required=True)
    pickup_location = LocationSerializer(required=True)
    dropoff_location = LocationSerializer(required=True)
    cycle_used_hours = serializers.FloatField(min_value=0.0, max_value=70.0, required=True)
    start_date = serializers.DateField(required=False, allow_null=True, default=None)
    start_time = serializers.CharField(max_length=10, required=False, allow_blank=True, default="06:00")
    timezone = serializers.CharField(max_length=60, required=False, allow_blank=True, default="America/Chicago")
    advanced = AdvancedDetailsSerializer(required=False, default=dict)

    def validate_cycle_used_hours(self, value: float) -> float:
        if math.isnan(value) or math.isinf(value):
            raise serializers.ValidationError("Cycle used hours must be a finite real number.")
        if value < 0.0 or value > 70.0:
            raise serializers.ValidationError("Current Cycle Used must be between 0.0 and 70.0 hours.")
        return round(value, 2)
