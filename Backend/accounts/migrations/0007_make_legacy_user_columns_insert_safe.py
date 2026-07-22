from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_sync_current_accounts_schema"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE accounts_user
            ALTER COLUMN is_email_verified SET DEFAULT false;

            ALTER TABLE accounts_user
            ALTER COLUMN created_at SET DEFAULT now();

            ALTER TABLE accounts_user
            ALTER COLUMN updated_at SET DEFAULT now();
            """,
            reverse_sql="""
            ALTER TABLE accounts_user
            ALTER COLUMN is_email_verified DROP DEFAULT;

            ALTER TABLE accounts_user
            ALTER COLUMN created_at DROP DEFAULT;

            ALTER TABLE accounts_user
            ALTER COLUMN updated_at DROP DEFAULT;
            """,
        ),
    ]
