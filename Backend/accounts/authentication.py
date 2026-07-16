from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class VerifiedJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user.is_active:
            raise AuthenticationFailed("User account is inactive.", code="user_inactive")
        if not getattr(user, "is_email_verified", False):
            raise AuthenticationFailed(
                "Email verification is required.",
                code="email_not_verified",
            )
        return user

