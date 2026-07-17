from django.urls import path

from projects.views import (
    AcceptProjectInvitationView,
    CreateProjectView,
    InvitationAcceptView,
    InvitationDetailView,
    InvitationRejectView,
    ProjectDetailView,
    ProjectInvitationCreateView,
    ProjectInvitationPreviewView,
    ProjectMemberListView,
    RejectProjectInvitationView,
)


urlpatterns = [
    path("projects/", CreateProjectView.as_view(), name="project-create"),
    path("my-projects/", CreateProjectView.as_view(), name="my-project-list"),
    path("projects/<int:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:project_id>/members/", ProjectMemberListView.as_view(), name="project-member-list"),
    path("projects/<int:project_id>/invitations/", ProjectInvitationCreateView.as_view(), name="project-invitation-create"),
    path("invitations/<str:token>/", InvitationDetailView.as_view(), name="invitation-detail"),
    path("invitations/<str:token>/accept/", InvitationAcceptView.as_view(), name="invitation-accept"),
    path("invitations/<str:token>/reject/", InvitationRejectView.as_view(), name="invitation-reject"),
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
