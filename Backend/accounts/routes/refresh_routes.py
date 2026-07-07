from django.urls import path

from accounts.views import RefreshTokenView

urlpatterns = [
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
]

