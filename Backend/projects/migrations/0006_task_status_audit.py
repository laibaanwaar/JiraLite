from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("projects", "0005_taskcomment"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="task",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="updated_tasks",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="TaskStatusHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "old_status",
                    models.CharField(
                        choices=[
                            ("TO_DO", "To Do"),
                            ("IN_PROGRESS", "In Progress"),
                            ("IN_REVIEW", "In Review"),
                            ("DONE", "Done"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "new_status",
                    models.CharField(
                        choices=[
                            ("TO_DO", "To Do"),
                            ("IN_PROGRESS", "In Progress"),
                            ("IN_REVIEW", "In Review"),
                            ("DONE", "Done"),
                        ],
                        max_length=20,
                    ),
                ),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="task_status_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_history",
                        to="projects.task",
                    ),
                ),
            ],
            options={
                "ordering": ["-changed_at", "-id"],
                "indexes": [
                    models.Index(fields=["task", "changed_at"], name="projects_tsh_task_chg_idx"),
                    models.Index(fields=["changed_by"], name="projects_tsh_user_idx"),
                ],
            },
        ),
    ]
