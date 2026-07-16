
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from projects.views import ProjectInvitationResponsePageView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('project-invitations/respond/', ProjectInvitationResponsePageView.as_view(), name='project-invitation-respond-page'),
    path('api/', include('accounts.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('tasks.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
