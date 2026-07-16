from rest_framework import serializers


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

