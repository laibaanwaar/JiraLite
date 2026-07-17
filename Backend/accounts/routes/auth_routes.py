from django.urls import path

from accounts.views import (
    LoginView,
    LogoutView,
    ProfileAvatarDeleteView,
    ProfileView,
    ResendVerificationView,
    SignupView,
    VerifyEmailView,
)


urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", ProfileView.as_view(), name="auth-me"),
    path("auth/signup/", SignupView.as_view(), name="auth-signup"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path(
        "auth/resend-verification/",
        ResendVerificationView.as_view(),
        name="auth-resend-verification",
    ),
    path("profile/", ProfileView.as_view(), name="profile-detail"),
    path("profile/avatar/", ProfileAvatarDeleteView.as_view(), name="profile-avatar-delete"),
]
