"""
API Integration tests using Django REST Framework test client.
"""

from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status

from services.models import Location, RouteLeg, RouteStep


class APITests(APITestCase):
    def test_health_check_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertIn("providers", response.data)

    def test_geocode_validation_failure(self):
        # Empty query
        response = self.client.post("/api/geocode/", {"query": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plan_trip_invalid_cycle_hours(self):
        payload = {
            "current_location": {"name": "Dallas", "latitude": 32.7, "longitude": -96.7},
            "pickup_location": {"name": "Waco", "latitude": 31.5, "longitude": -97.1},
            "dropoff_location": {"name": "Austin", "latitude": 30.2, "longitude": -97.7},
            "cycle_used_hours": 75.0,  # Invalid: > 70.0
        }
        response = self.client.post("/api/plan-trip/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plan_trip_negative_cycle_hours(self):
        payload = {
            "current_location": {"name": "Dallas", "latitude": 32.7, "longitude": -96.7},
            "pickup_location": {"name": "Waco", "latitude": 31.5, "longitude": -97.1},
            "dropoff_location": {"name": "Austin", "latitude": 30.2, "longitude": -97.7},
            "cycle_used_hours": -1.0,
        }
        response = self.client.post("/api/plan-trip/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plan_trip_accepts_full_country_name(self):
        payload = {
            "current_location": {"name": "Dallas, TX", "latitude": 32.78, "longitude": -96.80, "country": "United States"},
            "pickup_location": {"name": "Waco, TX", "latitude": 31.55, "longitude": -97.15, "country": "United States"},
            "dropoff_location": {"name": "Chicago, IL", "latitude": 41.88, "longitude": -87.63, "country": "United States"},
            "cycle_used_hours": 15.0,
        }
        # Validate that serializer accepts it without country length error
        from api.serializers import TripPlanRequestSerializer
        serializer = TripPlanRequestSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    @patch("services.routing.get_routing_provider")
    def test_plan_trip_success_with_mocked_routing(self, mock_get_router):
        # Setup mock router
        mock_router = MagicMock()
        mock_get_router.return_value = mock_router

        def side_effect_calc(origin, dest, leg_id):
            return RouteLeg(
                leg_id=leg_id,
                origin=origin,
                destination=dest,
                distance_miles=150.0,
                duration_seconds=3.0 * 3600,
                steps=[RouteStep(instruction=f"Drive to {dest.name}", distance_miles=150.0, duration_seconds=10800)],
                geometry_coords=[[origin.latitude, origin.longitude], [dest.latitude, dest.longitude]],
            )

        mock_router.calculate_leg.side_effect = side_effect_calc

        payload = {
            "current_location": {
                "name": "Dallas, TX",
                "formatted_address": "Dallas, TX, USA",
                "latitude": 32.7767,
                "longitude": -96.7970,
                "city": "Dallas",
                "state": "Texas",
                "country": "US",
            },
            "pickup_location": {
                "name": "Waco, TX",
                "formatted_address": "Waco, TX, USA",
                "latitude": 31.5493,
                "longitude": -97.1467,
                "city": "Waco",
                "state": "Texas",
                "country": "US",
            },
            "dropoff_location": {
                "name": "Austin, TX",
                "formatted_address": "Austin, TX, USA",
                "latitude": 30.2672,
                "longitude": -97.7431,
                "city": "Austin",
                "state": "Texas",
                "country": "US",
            },
            "cycle_used_hours": 15.5,
            "start_time": "06:00",
            "timezone": "America/Chicago",
            "advanced": {
                "driver_name": "John Doe",
                "carrier_name": "Lone Star Express",
                "truck_number": "TRK-101",
                "trailer_number": "TRL-202",
                "shipping_doc_number": "BOL-98765",
                "commodity": "General Freight",
            }
        }

        response = self.client.post("/api/plan-trip/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn("trip", data)
        self.assertIn("route", data)
        self.assertIn("stops", data)
        self.assertIn("timeline", data)
        self.assertIn("daily_logs", data)
        self.assertIn("hos_summary", data)
        self.assertIn("validation", data)

        self.assertEqual(data["hos_summary"]["status_label"], "Compliant")
        self.assertTrue(data["validation"]["is_compliant"])
        self.assertGreaterEqual(len(data["daily_logs"]), 1)

        # Verify daily log details
        first_log = data["daily_logs"][0]
        self.assertEqual(first_log["driver_name"], "John Doe")
        self.assertEqual(first_log["truck_number"], "TRK-101")
        self.assertEqual(first_log["total_hours"], 24.0)
