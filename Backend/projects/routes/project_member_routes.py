from django.urls import path

from projects.views.delete_project_member_view import DeleteProjectMemberView
from projects.views.create_project_member_view import CreateProjectMemberView

urlpatterns = [
    path(
        "projects/<project_id>/members/",
        CreateProjectMemberView.as_view(),
        name="project-member-list",
    ),
    path(
        "projects/<project_id>/members/",
        CreateProjectMemberView.as_view(),
        name="project-member-create",
    ),
    path(
        "projects/<project_id>/members/<user_id>/",
        DeleteProjectMemberView.as_view(),
        name="project-member-delete",
    ),
]
