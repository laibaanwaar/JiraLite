from rest_framework import serializers


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_code(self, value):
        normalized = (value or "").strip()
        if len(normalized) != 6 or not normalized.isdigit():
            raise serializers.ValidationError("Enter a valid 6-digit verification code.")
        return normalized
