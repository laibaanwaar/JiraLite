import logging

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.serializers.create_user_serializer import CreateUserSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.user_service import UserService


logger = logging.getLogger(__name__)


class UserListView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    def handle_exception(self, exc):
        if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
            return Response({"message": "Unauthorized."}, status=status.HTTP_401_UNAUTHORIZED)

        if isinstance(exc, exceptions.PermissionDenied):
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        if isinstance(exc, exceptions.ParseError):
            return Response(
                {"message": "Validation failed.", "errors": {"non_field_errors": ["Malformed JSON."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().handle_exception(exc)

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

    def post(self, request):
        """Create a new user account."""
        serializer = CreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            if "password" in serializer.errors:
                return Response(
                    {"message": "Password does not meet security requirements."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {"message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = UserService.create_user(
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            role_id=serializer.validated_data["role_id"],
        )

        if not result["success"]:
            code = result.get("code", "")

            if code == "role_not_found":
                return Response({"message": result["message"]}, status=status.HTTP_404_NOT_FOUND)

            if code == "duplicate_email":
                return Response({"message": result["message"]}, status=status.HTTP_409_CONFLICT)

            if code == "role_inactive":
                return Response({"message": result["message"]}, status=status.HTTP_400_BAD_REQUEST)

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": result["message"], "data": result["data"]},
            status=status.HTTP_201_CREATED,
        )
