from django.urls import path

from .project_member_views import (
    ProjectMemberListAPIView,
    RemoveProjectMemberAPIView,
)


urlpatterns = [
    path(
        "projects/<int:project_id>/members/",
        ProjectMemberListAPIView.as_view(),
        name="project-member-list",
    ),

    path(
        "projects/<int:project_id>/members/<int:user_id>/",
        RemoveProjectMemberAPIView.as_view(),
        name="remove-project-member",
    ),
]