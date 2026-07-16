from django.urls import path

from projects.views import AcceptProjectInvitationView, CreateProjectView


urlpatterns = [
    path("projects/", CreateProjectView.as_view(), name="project-create"),
    path(
        "project-invitations/accept/",
        AcceptProjectInvitationView.as_view(),
        name="project-invitation-accept",
    ),
]
