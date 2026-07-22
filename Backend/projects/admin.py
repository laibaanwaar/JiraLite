from django.contrib import admin

from .models import Project, ProjectMember


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "project_key",
        "name",
        "status",
        "created_by",
        "start_date",
        "end_date",
        "created_at",
    )
    search_fields = (
        "project_key",
        "name",
        "description",
        "created_by__email",
        "created_by__first_name",
        "created_by__last_name",
    )
    list_filter = (
        "status",
        "created_at",
        "start_date",
        "end_date",
    )
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = (
        "project",
        "user",
        "role",
        "status",
        "joined_at",
    )
    search_fields = (
        "project__project_key",
        "project__name",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    list_filter = (
        "role",
        "status",
        "joined_at",
        "project",
    )
    ordering = ("-joined_at",)
    autocomplete_fields = ("project", "user")
    readonly_fields = ("joined_at",)
