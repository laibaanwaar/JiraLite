import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import ProfileSerializer
from accounts.authentication import ProfileJWTAuthentication
from accounts.services.profile_service import ProfileService


logger = logging.getLogger(__name__)


class ProfileView(APIView):
    authentication_classes = [ProfileJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

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
            if not request.user.is_active:
                return Response(
                    {
                        "success": False,
                        "message": "Your account is inactive.",
                        "errors": {},
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            payload = ProfileService.get_profile_payload(user=request.user)
            serializer = ProfileSerializer(payload, context={"request": request})
            return Response(
                {
                    "success": True,
                    "message": "Profile retrieved successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except DatabaseError:
            logger.exception("Database error while retrieving profile.")
        except Exception:
            logger.exception("Unexpected error while retrieving profile.")
        return Response(
            {
                "success": False,
                "message": "A server error occurred. Please try again later.",
                "errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def patch(self, request):
        serializer = ProfileSerializer(data=request.data, partial=True, context={"request": request})
        try:
            if not request.user.is_active:
                return Response(
                    {
                        "success": False,
                        "message": "Your account is inactive.",
                        "errors": {},
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer.is_valid(raise_exception=True)
            payload = ProfileService.update_profile(
                user=request.user,
                validated_data=serializer.validated_data,
            )
            response_serializer = ProfileSerializer(payload, context={"request": request})
            return Response(
                {
                    "success": True,
                    "message": "Profile updated successfully.",
                    "data": response_serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DatabaseError:
            logger.exception("Database error while updating profile.")
        except Exception:
            logger.exception("Unexpected error while updating profile.")
        return Response(
            {
                "success": False,
                "message": "A server error occurred. Please try again later.",
                "errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class ProfileAvatarDeleteView(APIView):
    authentication_classes = [ProfileJWTAuthentication]
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

    def delete(self, request):
        try:
            ProfileService.delete_avatar(user=request.user)
            return Response(
                {
                    "success": True,
                    "message": "Profile avatar deleted successfully.",
                    "data": None,
                },
                status=status.HTTP_200_OK,
            )
        except DatabaseError:
            logger.exception("Database error while deleting profile avatar.")
        except Exception:
            logger.exception("Unexpected error while deleting profile avatar.")
        return Response(
            {
                "success": False,
                "message": "A server error occurred. Please try again later.",
                "errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
