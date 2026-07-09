from rest_framework import serializers


class RoleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    is_active = serializers.BooleanField()


class UserListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    is_active = serializers.BooleanField()
    role = RoleSerializer()
    date_joined = serializers.DateTimeField()
    created_at = serializers.DateTimeField()
