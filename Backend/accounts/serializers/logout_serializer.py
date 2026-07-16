from rest_framework import serializers


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(trim_whitespace=True, max_length=2048)

    def validate_refresh(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError("This field may not be blank.")
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("This field may not be blank.")
        return normalized
