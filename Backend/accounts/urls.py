from django.urls import include, path

urlpatterns = [
    path("", include("accounts.routes.login_routes")),
    path("", include("accounts.routes.refresh_routes")),
]
