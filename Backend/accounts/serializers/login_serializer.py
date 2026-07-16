from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=128,
    )

    def validate_email(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError("Enter a valid email address.")
        normalized = value.strip().lower()
        if not normalized:
            raise serializers.ValidationError("This field may not be blank.")
        return normalized

    def validate_password(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError("This field may not be blank.")
        if value == "":
            raise serializers.ValidationError("This field may not be blank.")
        return value

