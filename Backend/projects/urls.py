from django.urls import path

from .views import (
    ProjectDetailAPIView,
    ProjectListCreateAPIView,
)


urlpatterns = [
    path(
        "",
        ProjectListCreateAPIView.as_view(),
        name="project-list-create",
    ),

    path(
        "<int:project_id>/",
        ProjectDetailAPIView.as_view(),
        name="project-detail",
    ),
]