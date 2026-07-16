import logging

from django.db import DatabaseError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import ProjectMemberListSerializer
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class ProjectMemberListView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def get(self, request, project_id: int):
        try:
            result = ProjectService.list_project_members(user=request.user, project_id=project_id)
            serializer = ProjectMemberListSerializer(result["data"], many=True)
            return Response(
                {
                    "success": True,
                    "message": result["message"],
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except PermissionError:
            return Response(
                {
                    "success": False,
                    "message": "The requested project or task could not be found.",
                    "errors": {},
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while listing project members.")
        except Exception:
            logger.exception("Unexpected error while listing project members.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
