import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from accounts.services.exceptions import EmailDeliveryError


class ProjectInvitationEmailService:
    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def get_expiry():
        return timezone.now() + timedelta(
            hours=getattr(settings, "PROJECT_INVITATION_EXPIRY_HOURS", 48)
        )

    @staticmethod
    def build_accept_link(token: str) -> str:
        frontend_url = getattr(settings, "FRONTEND_URL", "").strip()
        if frontend_url:
            return f"{frontend_url.rstrip('/')}/invitations/accept?token={token}"

        accept_url = getattr(settings, "FRONTEND_ACCEPT_INVITATION_URL", "").strip()
        if accept_url:
            separator = "&" if "?" in accept_url else "?"
            return f"{accept_url}{separator}token={token}"

        backend_url = getattr(settings, "BACKEND_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
        return f"{backend_url}/project-invitations/respond/?token={token}"

    @staticmethod
    def send_invitation_email(*, invitation, inviter_name: str, project_name: str, token: str) -> None:
        link = ProjectInvitationEmailService.build_accept_link(token)
        message_text = invitation.message.strip()
        email_message = (
            f"{inviter_name} invited you to join the project \"{project_name}\".\n\n"
            f"Accept invitation: {link}\n\n"
            f"Invitation expires on {invitation.expires_at.isoformat()}.\n"
        )
        if message_text:
            email_message += f"\nPersonal message:\n{message_text}\n"

        try:
            send_mail(
                subject=f"Invitation to join {project_name}",
                message=email_message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[invitation.invited_email],
                fail_silently=False,
            )
        except Exception as exc:
            raise EmailDeliveryError("Invitation email could not be sent.") from exc
