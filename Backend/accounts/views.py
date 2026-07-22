from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    SignupSerializer,
    VerifyOTPSerializer,
    ResendOTPSerializer, 
)
from .services import (
    register_user_and_send_otp,
    verify_email_otp,
    resend_verification_otp,  
)


class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        user = register_user_and_send_otp(
            serializer.validated_data
        )

        return Response(
            {
                "message": (
                    "Signup successful. "
                    "A verification OTP has been sent "
                    "to your email."
                ),
                "data": {
                    "email": user.email,
                    "is_verified": user.is_verified,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        user = verify_email_otp(
            email=serializer.validated_data["email"],
            raw_otp=serializer.validated_data["otp"],
        )

        return Response(
            {
                "message": (
                    "Email verified successfully. "
                    "You can now log in."
                ),
                "data": {
                    "email": user.email,
                    "is_verified": user.is_verified,
                    "is_active": user.is_active,
                },
            },
            status=status.HTTP_200_OK,
        )

class ResendOTPAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(
            data=request.data,
        )

        # Missing/invalid email → HTTP 400 automatically
        serializer.is_valid(
            raise_exception=True,
        )

        # Service should:
        # 1. Find user
        # 2. Check user is not already verified
        # 3. Generate new OTP
        # 4. Replace old OTP
        # 5. Reset expiry and attempts
        # 6. Send new OTP email
        resend_verification_otp(
            email=serializer.validated_data["email"]
        )

        return Response(
            {
                "message": (
                    "A new verification OTP has been "
                    "sent to your email."
                )
            },
            status=status.HTTP_200_OK,
        )