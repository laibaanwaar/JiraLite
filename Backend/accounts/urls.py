from django.urls import path

from .views import (
    SignupAPIView,
    VerifyOTPAPIView,
    ResendOTPAPIView,
)

from .login_view import LoginAPIView
from .logout_view import LogoutAPIView
from .profile_view import ProfileAPIView


urlpatterns = [
    # Signup / OTP APIs
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("verify-otp/", VerifyOTPAPIView.as_view(), name="verify-otp"),
    path("resend-otp/", ResendOTPAPIView.as_view(), name="resend-otp"),

    # Login API
    path("login/", LoginAPIView.as_view(), name="login"),

    # Logout API
    path("logout/", LogoutAPIView.as_view(), name="logout"),

    # Profile API
    path("profile/", ProfileAPIView.as_view(), name="profile"),
]