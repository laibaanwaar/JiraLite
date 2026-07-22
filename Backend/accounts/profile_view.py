from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .profile_serializer import ProfileSerializer
from .profile_service import ProfileService


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = ProfileService.get_profile(request.user)
        serializer = ProfileSerializer(user)

        return Response(
            {
                "success": True,
                "message": "Profile retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        user = ProfileService.get_profile(request.user)

        serializer = ProfileSerializer(
            user,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        updated_user = ProfileService.update_profile(
            user=user,
            serializer=serializer,
        )

        response_serializer = ProfileSerializer(
            updated_user
        )

        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
