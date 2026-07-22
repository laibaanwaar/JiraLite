from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """
    Validates login request data.

    Password strength validation is NOT performed here because
    login only verifies an already-created password.

    Strong password validation belongs in:
    - Signup
    - Reset Password
    - Change Password
    """

    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        error_messages={
            "required": "Email is required.",
            "blank": "Email cannot be empty.",
            "invalid": "Enter a valid email address.",
        },
    )

    password = serializers.CharField(
        required=True,
        write_only=True,
        allow_blank=False,
        trim_whitespace=False,
        max_length=128,
        error_messages={
            "required": "Password is required.",
            "blank": "Password cannot be empty.",
            "max_length": "Password is too long.",
        },
    )

    def validate_email(self, value):
        """
        Normalize email before authentication.

        Example:
        User@Example.COM -> user@example.com
        """
        return value.strip().lower()