from rest_framework import serializers


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=64)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=64)

