import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from django.shortcuts import redirect, render
from rest_framework.views import APIView

from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class ProjectInvitationResponsePageView(APIView):
    authentication_classes = []
    permission_classes = []
    template_name = "projects/project_invitation_response.html"

    def _flatten_error_details(self, payload):
        if not isinstance(payload, dict):
            return []

        details = []
        for messages in payload.values():
            if isinstance(messages, (list, tuple)):
                details.extend(str(message) for message in messages)
            else:
                details.append(str(messages))
        return details

    def _is_no_longer_pending_error(self, payload):
        return "This invitation is no longer pending." in self._flatten_error_details(payload)

    def _render(
        self,
        request,
        *,
        token: str,
        preview=None,
        success_message="",
        error_message="",
        error_details=None,
        invitation_completed=False,
        status=200,
    ):
        preview_payload = preview
        if preview_payload and success_message:
            preview_payload = {**preview_payload, "status_message": None}
        return render(
            request,
            self.template_name,
            {
                "token": token,
                "preview": preview_payload,
                "success_message": success_message,
                "error_message": error_message,
                "error_details": error_details or [],
                "invitation_completed": invitation_completed,
            },
            status=status,
        )

    def get(self, request):
        token = (request.GET.get("token") or "").strip()
        result_flag = (request.GET.get("result") or "").strip().lower()
        if not token:
            return self._render(request, token="", error_message="Invitation token is required.", status=400)
        try:
            preview = ProjectService.get_invitation_preview_by_token(token=token)
            success_message = ""
            invitation_completed = False
            if result_flag == "accepted":
                success_message = "You are now part of the project."
                invitation_completed = True
            elif result_flag == "rejected":
                success_message = "Invitation rejected successfully."
                invitation_completed = True
            return self._render(
                request,
                token=token,
                preview=preview["data"],
                success_message=success_message,
                invitation_completed=invitation_completed,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {}
            return self._render(
                request,
                token=token,
                error_message="This invitation is not available.",
                error_details=[message for messages in payload.values() for message in messages] if payload else [],
                status=400,
            )
        except Exception:
            logger.exception("Unexpected error while rendering invitation response page.")
            return self._render(request, token=token, error_message="A server error occurred. Please try again later.", status=500)

    def post(self, request):
        token = (request.POST.get("token") or "").strip()
        action = (request.POST.get("action") or "").strip().lower()
        try:
            preview = ProjectService.get_invitation_preview_by_token(token=token)["data"]
            if action == "accept":
                ProjectService.accept_invitation_by_token(token=token)
                return redirect(f"/project-invitations/respond/?token={token}&result=accepted")
            if action == "reject":
                ProjectService.reject_invitation_by_token(token=token)
                return redirect(f"/project-invitations/respond/?token={token}&result=rejected")
            return self._render(request, token=token, preview=preview, error_message="Select a valid invitation action.", status=400)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {}
            preview = ProjectService.get_invitation_preview_by_token(token=token)["data"] if token else None
            if preview and self._is_no_longer_pending_error(payload):
                if action == "accept" and preview.get("status") == "ACCEPTED":
                    return redirect(f"/project-invitations/respond/?token={token}&result=accepted")
                if action == "reject" and preview.get("status") == "REJECTED":
                    return redirect(f"/project-invitations/respond/?token={token}&result=rejected")
            return self._render(
                request,
                token=token,
                preview=preview,
                error_message="Invitation action could not be completed.",
                error_details=self._flatten_error_details(payload),
                status=400,
            )
        except IntegrityError:
            preview = ProjectService.get_invitation_preview_by_token(token=token)["data"] if token else None
            return self._render(request, token=token, preview=preview, error_message="This user is already a project member.", status=409)
        except DatabaseError:
            logger.exception("Database error while processing invitation response page.")
        except Exception:
            logger.exception("Unexpected error while processing invitation response page.")
        return self._render(request, token=token, error_message="A server error occurred. Please try again later.", status=500)
