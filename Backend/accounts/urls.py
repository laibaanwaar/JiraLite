from django.urls import include, path

urlpatterns = [
    path("", include("accounts.routes.auth_routes")),
]

