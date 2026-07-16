from typing import Any, cast

from django.db import transaction

from accounts.models import UserProfile


class ProfileService:
    @staticmethod
    def get_profile(*, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    def get_profile_payload(*, user):
        profile = ProfileService.get_profile(user=user)
        return user, profile

    @staticmethod
    def update_profile(*, user, validated_data: dict):
        with cast(Any, transaction).atomic():
            profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
            user_updated = []

            if "first_name" in validated_data:
                user.first_name = validated_data["first_name"]
                user_updated.append("first_name")
            if "last_name" in validated_data:
                user.last_name = validated_data["last_name"]
                user_updated.append("last_name")

            if "phone" in validated_data:
                profile.phone = validated_data["phone"]
            if "bio" in validated_data:
                profile.bio = validated_data["bio"]
            if "profile_image" in validated_data:
                profile.profile_image = validated_data["profile_image"]

            if user_updated:
                user_updated.append("updated_at")
                user.save(update_fields=user_updated)
            profile.save()

        return user, profile

    @staticmethod
    def delete_avatar(*, user):
        with cast(Any, transaction).atomic():
            profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
            if profile.profile_image:
                profile.profile_image.delete(save=False)
            profile.profile_image = None
            profile.save(update_fields=["profile_image", "updated_at"])
        return user, profile
