from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/", include("projects.project_invitation_urls")),
       # Project Members
    path( "api/",include( "projects.project_member_urls")),

    # Tasks
    path( "api/", include("tasks.task_urls" )),
    # Dashboards
    path("api/",include("dashboard.urls")),
]