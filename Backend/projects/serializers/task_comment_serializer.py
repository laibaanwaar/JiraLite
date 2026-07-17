from rest_framework import serializers


class TaskCommentSerializer(serializers.Serializer):
    def _initials(self, user) -> str:
        first = (user.first_name or "").strip()
        last = (user.last_name or "").strip()
        initials = f"{first[:1]}{last[:1]}".upper()
        return initials or (user.email[:1] or "?").upper()

    def to_representation(self, instance):
        request_user = self.context.get("request_user")
        author = instance.author
        author_role = getattr(author, "role", None)
        can_manage = request_user is not None and author.id == request_user.id
        name = f"{author.first_name} {author.last_name}".strip() or author.email
        return {
            "id": instance.id,
            "author": {
                "id": author.id,
                "name": name,
                "email": author.email,
                "role": {
                    "id": author_role.id,
                    "code": author_role.code,
                    "name": author_role.name,
                }
                if author_role
                else None,
                "initials": self._initials(author),
            },
            "content": instance.content,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
            "can_edit": can_manage,
            "can_delete": can_manage,
        }


class CreateTaskCommentSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000, trim_whitespace=True)

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment content cannot be blank.")
        return value.strip()


class UpdateTaskCommentSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000, trim_whitespace=True)

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment content cannot be blank.")
        return value.strip()
