from django.conf import settings
from django.urls import include, path
from django.views.static import serve as static_serve

urlpatterns = [
    path("api/auth/", include("users.urls")),
    path("api/", include("courses.urls")),
    path("api/enrollments/", include("enrollments.urls")),
    path("api/certificates/", include("certificates.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/books/", include("books.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/community/", include("community.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/admin/", include("admin_panel.urls")),
]

if settings.DEBUG:
    urlpatterns += [
        path(
            "media/<path:path>",
            static_serve,
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]
