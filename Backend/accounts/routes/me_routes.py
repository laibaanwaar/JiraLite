from django.urls import path

from accounts.views import MeView

urlpatterns = [
    path("auth/me/", MeView.as_view(), name="auth-me"),
]

