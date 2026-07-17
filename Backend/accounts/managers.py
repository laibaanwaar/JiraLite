from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def normalize_email_value(self, email: str) -> str:
        return (email or "").strip().lower()

    def _create_user(self, email: str, password: str, **extra_fields):
        from accounts.models import Role

        if not email:
            raise ValueError("The email field must be set.")

        normalized_email = self.normalize_email_value(email)
        if extra_fields.get("role") is None:
            extra_fields["role"] = Role.objects.get(code=Role.CODE_ADMIN)
        user = self.model(email=normalized_email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_email_verified", False)

        if password is None:
            raise ValueError("Users must have a password.")

        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_email_verified", True)

        return self._create_user(email, password, **extra_fields)
