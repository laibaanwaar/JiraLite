import logging
from typing import Any, cast

from django.contrib.auth import get_user_model
from django.db import DatabaseError, OperationalError, transaction
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken


logger = logging.getLogger(__name__)


class AuthService:
    """Handle authentication business logic."""

    @staticmethod
    def login(*, email: str, password: str) -> dict:
        User = get_user_model()
        user = User.objects.select_related("role").filter(email=email).first()

        if user is None:
            return {
                "success": False,
                "message": "Invalid email or password.",
            }

        if not user.check_password(password):
            return {
                "success": False,
                "message": "Invalid email or password.",
            }

        if not user.is_active:
            return {
                "success": False,
                "message": "Your account is inactive.",
            }

        if hasattr(user, "role") and user.role and not user.role.is_active:
            return {
                "success": False,
                "message": "Your role is inactive.",
            }

        refresh = RefreshToken.for_user(user)

        return {
            "success": True,
            "message": "Login successful.",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "role": user.role.name if user.role else None,
                },
            },
        }

    @staticmethod
    def refresh_access_token(*, refresh_token: str) -> dict:
        User = get_user_model()

        try:
            with transaction.atomic():
                token = RefreshToken(cast(Any, refresh_token))
                user_id = token.payload.get(api_settings.USER_ID_CLAIM)
                token_jti = token.payload.get(api_settings.JTI_CLAIM)

                if not user_id or not token_jti:
                    return {
                        "success": False,
                        "message": "Invalid or expired refresh token.",
                    }

                outstanding_token = (
                    OutstandingToken.objects.select_for_update()
                    .order_by("id")
                    .filter(jti=token_jti)
                    .first()
                )
                if outstanding_token is None:
                    return {
                        "success": False,
                        "message": "Invalid or expired refresh token.",
                    }

                if BlacklistedToken.objects.filter(token=outstanding_token).exists():
                    return {
                        "success": False,
                        "message": "Invalid or expired refresh token.",
                    }

                user = User.objects.select_related("role").filter(id=user_id).first()

                if user is None:
                    return {
                        "success": False,
                        "message": "Invalid or expired refresh token.",
                    }

                if not user.is_active:
                    return {
                        "success": False,
                        "message": "Your account is inactive.",
                    }

                if hasattr(user, "role") and user.role and not user.role.is_active:
                    return {
                        "success": False,
                        "message": "Your role is inactive.",
                    }

                new_refresh = RefreshToken.for_user(user)
                token.blacklist()

                return {
                    "success": True,
                    "message": "Token refreshed successfully.",
                    "data": {
                        "access": str(new_refresh.access_token),
                        "refresh": str(new_refresh),
                    },
                }
        except TokenError:
            return {
                "success": False,
                "message": "Invalid or expired refresh token.",
            }
        except (DatabaseError, OperationalError):
            logger.exception("Refresh token request failed due to database error.")
            return {
                "success": False,
                "message": "Authentication service unavailable.",
            }
        except Exception:
            logger.exception("Unexpected error while refreshing token.")
            return {
                "success": False,
                "message": "Authentication service unavailable.",
            }

    @staticmethod
    def logout_refresh_token(*, refresh_token: str) -> dict:
        try:
            token = UntypedToken(cast(Any, refresh_token))
            token_type = token.payload.get(api_settings.TOKEN_TYPE_CLAIM)

            if token_type != "refresh":
                return {
                    "success": False,
                    "message": "Invalid or expired refresh token.",
                }

            with transaction.atomic():
                refresh = RefreshToken(cast(Any, refresh_token), verify=False)
                refresh.blacklist()

            return {
                "success": True,
                "message": "Logout successful.",
            }
        except TokenError:
            return {
                "success": False,
                "message": "Invalid or expired refresh token.",
            }
        except (DatabaseError, OperationalError):
            logger.exception("Logout request failed due to database error.")
            return {
                "success": False,
                "message": "Authentication service unavailable.",
            }
        except Exception:
            logger.exception("Unexpected error while logging out.")
            return {
                "success": False,
                "message": "Authentication service unavailable.",
            }

    @staticmethod
    def get_current_user_profile(*, user) -> dict:
        try:
            if user is None:
                return {
                    "success": False,
                    "message": "User not found.",
                }

            if not user.is_active:
                return {
                    "success": False,
                    "message": "Your account is inactive.",
                }

            if hasattr(user, "role") and user.role and not user.role.is_active:
                return {
                    "success": False,
                    "message": "Your role is inactive.",
                }

            return {
                "success": True,
                "message": "Profile fetched successfully.",
                "data": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "role": user.role.name if user.role else None,
                    "role_code": user.role.code if user.role else None,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "date_joined": user.date_joined,
                },
            }
        except (DatabaseError, OperationalError):
            logger.exception("Profile request failed due to database error.")
            return {
                "success": False,
                "message": "Authentication service unavailable.",
            }
        except Exception:
            logger.exception("Unexpected error while fetching user profile.")
            return {
                "success": False,
                "message": "Authentication service unavailable.",
            }
