from django.urls import path

from projects.views import (
    AcceptProjectInvitationView,
    CreateProjectView,
    ProjectDetailView,
    ProjectInvitationPreviewView,
    ProjectMemberListView,
    RejectProjectInvitationView,
)


urlpatterns = [
    path("projects/", CreateProjectView.as_view(), name="project-create"),
    path("projects/<int:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:project_id>/members/", ProjectMemberListView.as_view(), name="project-member-list"),
    path(
        "project-invitations/preview/",
        ProjectInvitationPreviewView.as_view(),
        name="project-invitation-preview",
    ),
    path(
        "project-invitations/accept/",
        AcceptProjectInvitationView.as_view(),
        name="project-invitation-accept",
    ),
    path(
        "project-invitations/reject/",
        RejectProjectInvitationView.as_view(),
        name="project-invitation-reject",
    ),
]
