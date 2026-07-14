from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="due_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="task",
            name="priority",
            field=models.CharField(
                choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
                default="medium",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="status",
            field=models.CharField(
                choices=[("todo", "To Do"), ("in_progress", "In Progress"), ("done", "Done")],
                default="todo",
                max_length=20,
            ),
        ),
    ]
