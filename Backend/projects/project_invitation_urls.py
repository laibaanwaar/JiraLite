from django.urls import path

from .project_invitation_views import (
    AcceptProjectInvitationAPIView,
    CancelProjectInvitationAPIView,
    DeclineProjectInvitationAPIView,
    InvitationListAPIView,
    SendProjectInvitationsAPIView,
)


urlpatterns = [
    # Project Admin sends invitations
    path(
        "projects/<int:project_id>/invitations/",
        SendProjectInvitationsAPIView.as_view(),
        name="send-project-invitations",
    ),

    # Logged-in user views own invitations
    path(
        "invitations/",
        InvitationListAPIView.as_view(),
        name="invitation-list",
    ),

    # Invited user accepts
    path(
        "invitations/<str:token>/accept/",
        AcceptProjectInvitationAPIView.as_view(),
        name="accept-project-invitation",
    ),

    # Invited user declines
    path(
        "invitations/<str:token>/decline/",
        DeclineProjectInvitationAPIView.as_view(),
        name="decline-project-invitation",
    ),

    # Project Admin cancels pending invitation
    path(
        "invitations/<int:invitation_id>/",
        CancelProjectInvitationAPIView.as_view(),
        name="cancel-project-invitation",
    ),
]