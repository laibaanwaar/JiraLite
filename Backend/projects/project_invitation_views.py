from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .project_invitation_serializers import (
    ProjectInvitationSerializer,
    SendProjectInvitationsSerializer,
)
from .project_invitation_services import (
    accept_project_invitation,
    cancel_project_invitation,
    decline_project_invitation,
    get_user_invitations,
    send_project_invitations,
)


class SendProjectInvitationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        project_id,
    ):
        serializer = SendProjectInvitationsSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        result = send_project_invitations(
            project_id=project_id,
            requesting_user=request.user,
            emails=serializer.validated_data[
                "emails"
            ],
        )

        # All invitations failed.
        if not result["invited"]:
            return Response(
                {
                    "message": (
                        "No invitations were sent."
                    ),
                    "data": result,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": (
                    "Invitation processing completed."
                ),
                "data": result,
            },
            status=status.HTTP_201_CREATED,
        )


class InvitationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = get_user_invitations(
            request.user
        )

        serializer = ProjectInvitationSerializer(
            invitations,
            many=True,
        )

        return Response(
            {
                "message": (
                    "Invitations retrieved successfully."
                ),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AcceptProjectInvitationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        token,
    ):
        (
            invitation,
            membership,
            already_accepted,
        ) = accept_project_invitation(
            token=token,
            requesting_user=request.user,
        )

        if already_accepted:
            message = (
                "Invitation was already accepted."
            )
        else:
            message = (
                "Invitation accepted successfully."
            )

        return Response(
            {
                "message": message,
                "data": {
                    "project_id": (
                        invitation.project_id
                    ),
                    "membership_id": (
                        membership.id
                        if membership
                        else None
                    ),
                    "role": (
                        membership.role
                        if membership
                        else None
                    ),
                    "status": invitation.status,
                },
            },
            status=status.HTTP_200_OK,
        )


class DeclineProjectInvitationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        token,
    ):
        invitation, already_declined = (
            decline_project_invitation(
                token=token,
                requesting_user=request.user,
            )
        )

        return Response(
            {
                "message": (
                    "Invitation was already declined."
                    if already_declined
                    else
                    "Invitation declined successfully."
                ),
                "data": {
                    "id": invitation.id,
                    "status": invitation.status,
                },
            },
            status=status.HTTP_200_OK,
        )


class CancelProjectInvitationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(
        self,
        request,
        invitation_id,
    ):
        invitation, already_cancelled = (
            cancel_project_invitation(
                invitation_id=invitation_id,
                requesting_user=request.user,
            )
        )

        return Response(
            {
                "message": (
                    "Invitation was already cancelled."
                    if already_cancelled
                    else
                    "Invitation cancelled successfully."
                ),
                "data": {
                    "id": invitation.id,
                    "status": invitation.status,
                },
            },
            status=status.HTTP_200_OK,
        )