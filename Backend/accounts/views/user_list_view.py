import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.user_service import UserService


logger = logging.getLogger(__name__)


class UserListView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    def get(self, request):
        try:
            search = request.query_params.get("search", "").strip()
            filter_field = request.query_params.get("filter", "").strip().lower()
            filter_value = request.query_params.get("filter_value", "").strip()
            sort_by = request.query_params.get("sort", "email").strip().lower()

            try:
                limit = int(request.query_params.get("limit", 10))
                offset = int(request.query_params.get("offset", 0))

                if limit < 1 or limit > 100:
                    return Response(
                        {"message": "Limit must be between 1 and 100."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if offset < 0:
                    return Response(
                        {"message": "Offset must be non-negative."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except (ValueError, TypeError):
                return Response(
                    {"message": "Invalid limit or offset parameter."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = UserService.get_all_users(
                search=search,
                filter_field=filter_field,
                filter_value=filter_value,
                sort_by=sort_by,
                offset=offset,
                limit=limit,
            )

            if not result["success"]:
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "message": result["message"],
                    "data": result["data"],
                    "pagination": result["pagination"],
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception("Unexpected error while listing users.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
