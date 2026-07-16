import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.services.admin_dashboard_service import (
    AdminDashboardNotFoundError,
    AdminDashboardPermissionError,
    AdminDashboardService,
)


logger = logging.getLogger(__name__)


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {
                    "success": False,
                    "message": "Authentication credentials were not provided or are invalid.",
                    "errors": {},
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def get(self, request):
        try:
            result = AdminDashboardService.get_admin_dashboard(
                user=request.user,
                project_id=request.query_params.get("project_id"),
            )
            return Response(result, status=status.HTTP_200_OK)
        except (DRFValidationError, DjangoValidationError) as exc:
            payload = exc.detail if hasattr(exc, "detail") else exc.message_dict if hasattr(exc, "message_dict") else {}
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except AdminDashboardPermissionError:
            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to access this admin dashboard.",
                    "errors": {},
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        except AdminDashboardNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while retrieving admin dashboard.")
        except Exception:
            logger.exception("Unexpected error while retrieving admin dashboard.")
        return Response(
            {
                "success": False,
                "message": "A server error occurred. Please try again later.",
                "errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
