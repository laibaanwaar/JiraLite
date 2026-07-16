from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0002_task"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="projectinvitation",
            constraint=models.UniqueConstraint(
                fields=("project", "invited_email"),
                condition=Q(status="PENDING"),
                name="unique_pending_project_invitation_per_email",
            ),
        ),
    ]
