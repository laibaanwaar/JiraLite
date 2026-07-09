from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings

class SafeJWTAuthentication(JWTAuthentication):
    """
    Custom JWTAuthentication that does not raise AuthenticationFailed for inactive users.
    This allows the permission class (IsActiveAuthenticatedUser) to handle active checking,
    so that views can return a 403 Forbidden instead of 401 Unauthorized for inactive users.
    """
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        try:
            user = self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")

        # Do NOT raise AuthenticationFailed if not user.is_active.
        # Return the user object as is, and let IsActiveAuthenticatedUser block them with 403.
        return user
