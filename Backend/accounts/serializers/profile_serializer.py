import re

from rest_framework import serializers


PHONE_PATTERN = re.compile(r"^[0-9+\-() ]+$")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_SIGNATURES = (
    (b"\xff\xd8\xff", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"RIFF", "webp"),
)
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


class ProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, max_length=150)
    last_name = serializers.CharField(required=False, max_length=150)
    email = serializers.EmailField(read_only=True)
    profile_image = serializers.FileField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    bio = serializers.CharField(required=False, allow_blank=True, max_length=500)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

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

    def validate_phone(self, value):
        normalized = value.strip()
        if normalized and not PHONE_PATTERN.fullmatch(normalized):
            raise serializers.ValidationError("Enter a valid phone number.")
        return normalized

    def validate_bio(self, value):
        return value.strip()

    def validate_profile_image(self, value):
        if value is None:
            return value

        if getattr(value, "size", 0) > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError("Profile image size must not exceed 5 MB.")

        content_type = getattr(value, "content_type", "")
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError("Only JPG, PNG, and WebP images are allowed.")

        original_position = value.tell() if hasattr(value, "tell") else 0
        header = value.read(16)
        value.seek(original_position)

        is_png = header.startswith(ALLOWED_IMAGE_SIGNATURES[1][0])
        is_jpg = header.startswith(ALLOWED_IMAGE_SIGNATURES[0][0])
        is_webp = header.startswith(ALLOWED_IMAGE_SIGNATURES[2][0]) and header[8:12] == b"WEBP"

        if not any((is_png, is_jpg, is_webp)):
            raise serializers.ValidationError("Invalid or damaged image file.")

        return value

    def to_representation(self, instance):
        user, profile = instance
        request = self.context.get("request")
        image_url = None
        if profile.profile_image:
            image_url = profile.profile_image.url
            if request is not None:
                image_url = request.build_absolute_uri(image_url)

        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "profile_image": image_url,
            "phone": profile.phone,
            "bio": profile.bio,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        }
