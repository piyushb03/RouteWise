"""
Root URL configuration for RouteWise backend.
Routes /api/ to the API endpoints and serves the React SPA for all other frontend routes.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from pathlib import Path

def spa_fallback_view(request):
    """Serve the React SPA index.html in production if built, or an informative JSON in dev."""
    index_file = settings.BASE_DIR.parent / "frontend" / "dist" / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return HttpResponse(f.read(), content_type="text/html")
    return JsonResponse({
        "app": "RouteWise ELD Trip Planner Backend",
        "status": "online",
        "api_docs": "/api/health/",
        "message": "Frontend dev server runs at http://localhost:5173. In production, run 'npm run build' to generate frontend/dist.",
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    re_path(r"^(?!api/|admin/|static/|assets/).*$", spa_fallback_view, name="spa_fallback"),
]
