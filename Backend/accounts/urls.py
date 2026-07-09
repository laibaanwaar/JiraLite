from django.urls import include, path

urlpatterns = [
    path("", include("accounts.routes.login_routes")),
    path("", include("accounts.routes.refresh_routes")),
    path("", include("accounts.routes.logout_routes")),
    path("", include("accounts.routes.me_routes")),
    path("", include("accounts.routes.user_routes")),
]
