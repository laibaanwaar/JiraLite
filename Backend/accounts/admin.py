from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import EmailVerificationOTP, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = (
        "id",
        "email",
        "is_verified",
        "is_active",
        "is_staff",
        "is_superuser",
        "last_login",
        "date_joined",
    )
    list_filter = (
        "is_verified",
        "is_active",
        "is_staff",
        "is_superuser",
        "groups",
    )
    search_fields = (
        "email",
        "first_name",
        "last_name",
    )
    ordering = ("email",)
    readonly_fields = (
        "last_login",
        "date_joined",
    )
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_verified",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "is_verified",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )


@admin.register(EmailVerificationOTP)
class EmailVerificationOTPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "expires_at",
        "attempts",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "expires_at",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "user__email",
    )
    readonly_fields = (
        "otp_hash",
        "created_at",
        "updated_at",
    )
    autocomplete_fields = ("user",)
