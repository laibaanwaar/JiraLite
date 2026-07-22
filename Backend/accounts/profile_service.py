import logging

from rest_framework.exceptions import APIException


logger = logging.getLogger(__name__)


class ProfileAccessError(APIException):
    status_code = 403
    default_detail = "You do not have permission to access this profile."
    default_code = "profile_access_denied"


class ProfileUpdateError(APIException):
    status_code = 500
    default_detail = "Unable to update profile. Please try again."
    default_code = "profile_update_failed"


class ProfileService:
    @staticmethod
    def get_profile(user):
        """
        Return authenticated user's profile.
        """

        if not user or not user.is_authenticated:
            raise ProfileAccessError()

        return user

    @staticmethod
    def update_profile(user, serializer):
        """
        Update safe editable profile fields.
        """

        try:
            return serializer.save()

        except Exception:
            logger.exception(
                "Unexpected error while updating profile "
                "for user_id=%s",
                user.pk,
            )

            raise ProfileUpdateError()
