from accounts.models import Role


def build_role_payload(role) -> dict | None:
    if role is None:
        return None
    return {
        "id": role.id,
        "code": role.code,
        "name": role.name,
    }


def build_user_payload(user) -> dict:
    role = getattr(user, "role", None)
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "is_email_verified": user.is_email_verified,
        "is_active": user.is_active,
        "role": build_role_payload(role),
    }


def get_role_by_code(*, code: str) -> Role:
    return Role.objects.get(code=code)
