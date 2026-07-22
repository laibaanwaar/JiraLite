from django.urls import path

from .views import (
    PersonalDashboardAPIView,
    ProjectDashboardAPIView,
)


urlpatterns = [

    # -----------------------------------------
    # Logged-in user's personal dashboard
    #
    # GET /api/dashboard/me/
    # -----------------------------------------

    path(
        "dashboard/me/",
        PersonalDashboardAPIView.as_view(),
        name="personal-dashboard",
    ),

    # -----------------------------------------
    # Specific project dashboard
    #
    # GET /api/projects/{project_id}/dashboard/
    # -----------------------------------------

    path(
        "projects/<int:project_id>/dashboard/",
        ProjectDashboardAPIView.as_view(),
        name="project-dashboard",
    ),
]