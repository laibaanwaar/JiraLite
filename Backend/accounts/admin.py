from django.contrib import admin

from accounts.models.role import Role
from accounts.models.user import User

admin.site.register(Role)
admin.site.register(User)

