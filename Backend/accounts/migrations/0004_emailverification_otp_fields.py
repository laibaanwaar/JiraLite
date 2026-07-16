from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_user_date_joined"),
    ]

    operations = [
        migrations.RenameField(
            model_name="emailverification",
            old_name="token_hash",
            new_name="otp_hash",
        ),
        migrations.AlterField(
            model_name="emailverification",
            name="otp_hash",
            field=models.CharField(db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name="emailverification",
            name="failed_attempts",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="emailverification",
            name="last_sent_at",
            field=models.DateTimeField(default=timezone.now),
            preserve_default=False,
        ),
    ]
