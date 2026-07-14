import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from tasks.serializers.task_serializer import TaskSerializer
from tasks.services.permissions import IsAdminRole
from tasks.services.task_service import TaskService


logger = logging.getLogger(__name__)


class TaskListView(APIView):
    """List tasks."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        try:
            search = request.query_params.get("search", "")
            filter_field = request.query_params.get("filter", "")
            filter_value = request.query_params.get("filter_value", "")
            sort_by = request.query_params.get("sort", "title")
            limit = request.query_params.get("limit", 10)
            offset = request.query_params.get("offset", 0)

            result = TaskService.get_all_tasks(
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

            serializer = TaskSerializer(result["data"], many=True)
            return Response(
                {
                    "message": result["message"],
                    "data": serializer.data,
                    "pagination": result["pagination"],
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            logger.exception("Unexpected error while listing tasks.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
