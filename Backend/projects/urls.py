from django.urls import include, path

urlpatterns = [
    path("", include("projects.routes.project_routes")),
    path("", include("projects.routes.project_member_routes")),
]
