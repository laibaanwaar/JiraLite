from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Task",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, max_length=5000)),
                ("priority", models.CharField(choices=[("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High"), ("URGENT", "Urgent")], default="MEDIUM", max_length=20)),
                ("status", models.CharField(choices=[("TO_DO", "To Do"), ("IN_PROGRESS", "In Progress"), ("IN_REVIEW", "In Review"), ("DONE", "Done")], default="TO_DO", max_length=20)),
                ("due_date", models.DateField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("assignee", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="assigned_tasks", to="projects.projectmember")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="created_tasks", to=settings.AUTH_USER_MODEL)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="projects.project")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["project"], name="projects_ta_project_2a28eb_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["assignee"], name="projects_ta_assigne_17bc7e_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["status"], name="projects_ta_status_fc176d_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["priority"], name="projects_ta_priorit_692086_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["due_date"], name="projects_ta_due_dat_50c3c8_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["created_at"], name="projects_ta_created_9380f1_idx"),
        ),
    ]
