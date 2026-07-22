from rest_framework import serializers


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            "required": "Refresh token is required.",
            "blank": "Refresh token cannot be empty.",
        },
    )