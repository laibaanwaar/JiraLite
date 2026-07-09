from django.urls import path

from accounts.views import LogoutView

urlpatterns = [
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
]

