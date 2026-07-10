from django.urls import path

from projects.views import ArchiveProjectView, CreateProjectView, UpdateProjectView

urlpatterns = [
    path("projects/", CreateProjectView.as_view(), name="project-list"),
    path("projects/", CreateProjectView.as_view(), name="project-create"),
    path("projects/<project_id>/", UpdateProjectView.as_view(), name="project-detail"),
    path("projects/<project_id>/archive/", ArchiveProjectView.as_view(), name="project-archive"),
]
