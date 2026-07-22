from rest_framework import serializers

from .models import User


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
        ]

        read_only_fields = [
            "id",
            "email",
        ]