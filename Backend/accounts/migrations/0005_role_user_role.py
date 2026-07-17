from django.db import migrations, models
import django.db.models.deletion


def seed_roles_and_assign_users(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    User = apps.get_model("accounts", "User")

    admin_role, _ = Role.objects.get_or_create(code="ADMIN", defaults={"name": "Admin"})
    Role.objects.get_or_create(code="MEMBER", defaults={"name": "Member"})
    User.objects.filter(role__isnull=True).update(role=admin_role)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_emailverification_otp_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Role",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(choices=[("ADMIN", "Admin"), ("MEMBER", "Member")], max_length=20, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="users", to="accounts.role"),
        ),
        migrations.RunPython(seed_roles_and_assign_users, migrations.RunPython.noop),
    ]
