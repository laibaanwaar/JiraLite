from rest_framework import serializers


class InvitationAcceptSignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=64)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=64)

    def validate_first_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("First name cannot be blank.")
        return normalized

    def validate_last_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Last name cannot be blank.")
        return normalized
