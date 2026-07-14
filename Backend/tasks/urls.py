from django.urls import include, path

urlpatterns = [
    path("", include("tasks.routes.task_routes")),
]
