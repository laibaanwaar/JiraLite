from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0003_projectinvitation_unique_pending_project_invitation_per_email"),
    ]

    operations = [
        migrations.RenameField(
            model_name="projectinvitation",
            old_name="role",
            new_name="project_role",
        ),
        migrations.AddField(
            model_name="projectinvitation",
            name="rejected_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
