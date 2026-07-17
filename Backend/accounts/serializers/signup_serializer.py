from rest_framework import serializers


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=64)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=64)
    restricted_fields = {"role", "is_staff", "is_superuser", "is_active"}

    def to_internal_value(self, data):
        if isinstance(data, dict):
            restricted_keys = sorted(key for key in data.keys() if key in self.restricted_fields)
            if restricted_keys:
                raise serializers.ValidationError(
                    {key: ["This field is not allowed."] for key in restricted_keys}
                )
        return super().to_internal_value(data)
