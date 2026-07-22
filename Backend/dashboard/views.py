import logging

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    get_personal_dashboard,
    get_project_dashboard,
)


logger = logging.getLogger(__name__)


class PersonalDashboardAPIView(APIView):
    """
    GET /api/dashboard/me/

    Returns dashboard information for the
    currently authenticated user.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        try:

            dashboard = get_personal_dashboard(
                user=request.user,
            )

            return Response(
                {
                    "message": (
                        "Personal dashboard "
                        "retrieved successfully."
                    ),
                    "data": dashboard,
                },
                status=status.HTTP_200_OK,
            )

        except APIException:
            # Allow DRF to correctly return
            # authentication/permission errors.
            raise

        except Exception:

            logger.exception(
                (
                    "Unexpected error while generating "
                    "personal dashboard for user_id=%s"
                ),
                request.user.id,
            )

            return Response(
                {
                    "detail": (
                        "An unexpected server error occurred."
                    )
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )


class ProjectDashboardAPIView(APIView):
    """
    GET /api/projects/{project_id}/dashboard/

    Only ACTIVE project members can access it.

    Both ADMIN and MEMBER can view the dashboard.
    Their project-specific role is returned in
    current_user_role.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def get(
        self,
        request,
        project_id,
    ):

        try:

            dashboard = get_project_dashboard(
                project_id=project_id,
                requesting_user=request.user,
            )

            return Response(
                {
                    "message": (
                        "Project dashboard "
                        "retrieved successfully."
                    ),
                    "data": dashboard,
                },
                status=status.HTTP_200_OK,
            )

        except APIException:
            # Preserve proper DRF errors such as:
            # 401, 403 and 404.
            raise

        except Exception:

            logger.exception(
                (
                    "Unexpected error while generating "
                    "project dashboard. "
                    "project_id=%s user_id=%s"
                ),
                project_id,
                request.user.id,
            )

            return Response(
                {
                    "detail": (
                        "An unexpected server error occurred."
                    )
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )