import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from projects.serializers.project_list_serializer import ProjectListSerializer
from projects.services.permissions import IsAdminOrProjectManagerRole
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class ProjectListView(APIView):
    """List projects."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsAdminOrProjectManagerRole]

    def get(self, request):
        try:
            search = request.query_params.get("search", "")
            filter_field = request.query_params.get("filter", "")
            filter_value = request.query_params.get("filter_value", "")
            sort_by = request.query_params.get("sort", "name")
            limit = request.query_params.get("limit", 10)
            offset = request.query_params.get("offset", 0)

            result = ProjectService.get_all_projects(
                search=search,
                filter_field=filter_field,
                filter_value=filter_value,
                sort_by=sort_by,
                offset=offset,
                limit=limit,
            )

            if not result["success"]:
                code = result.get("code", "")

                if code in ("invalid_limit_offset", "invalid_sort", "invalid_filter", "invalid_filter_value"):
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            serializer = ProjectListSerializer(result["data"], many=True)
            return Response(
                {
                    "message": result["message"],
                    "data": serializer.data,
                    "pagination": result["pagination"],
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            logger.exception("Unexpected error while listing projects.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
