"""
API URL Routing.
"""

from django.urls import path
from .views import (
    HealthCheckView,
    GeocodeView,
    ReverseGeocodeView,
    PlanTripView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path("geocode/", GeocodeView.as_view(), name="geocode"),
    path("reverse-geocode/", ReverseGeocodeView.as_view(), name="reverse_geocode"),
    path("plan-trip/", PlanTripView.as_view(), name="plan_trip"),
]
