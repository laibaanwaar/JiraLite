import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from projects.serializers.project_detail_serializer import ProjectDetailSerializer
from projects.services.permissions import IsAdminOrProjectManagerRole
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class ArchiveProjectView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsAdminOrProjectManagerRole]

    def patch(self, request, project_id):
        try:
            result = ProjectService.archive_project(project_id=project_id)
        except Exception:
            logger.exception("Unexpected error while archiving project.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code == "invalid_project_id":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code == "project_not_found":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if code == "project_archived":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = ProjectDetailSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": serializer.data},
            status=status.HTTP_200_OK,
        )
