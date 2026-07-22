from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail


class InvitationEmailDeliveryError(Exception):
    """
    Internal exception used when invitation
    email cannot be sent.
    """
    pass


def build_invitation_url(invitation):
    """
    Generate frontend invitation URL.

    Example:
    http://127.0.0.1:5173/invitations/respond?token=xyz
    """

    configured_url = getattr(
        settings,
        "FRONTEND_ACCEPT_INVITATION_URL",
        "",
    ).strip()

    if configured_url:
        base_url = configured_url
    else:
        frontend_url = getattr(
            settings,
            "FRONTEND_URL",
            "http://127.0.0.1:5173",
        ).rstrip("/")

        base_url = (
            f"{frontend_url}/invitations/respond"
        )

    separator = "&" if "?" in base_url else "?"

    query_string = urlencode(
        {
            "token": invitation.token,
        }
    )

    return (
        f"{base_url}"
        f"{separator}"
        f"{query_string}"
    )


def send_project_invitation_email(invitation):
    invitation_url = build_invitation_url(
        invitation
    )

    inviter_name = (
        f"{invitation.invited_by.first_name} "
        f"{invitation.invited_by.last_name}"
    ).strip()

    if not inviter_name:
        inviter_name = invitation.invited_by.email

    try:
        sent_count = send_mail(
            subject=(
                f"Invitation to join "
                f"{invitation.project.name}"
            ),
            message=(
                f"Hello "
                f"{invitation.invited_user.first_name},\n\n"

                f"{inviter_name} invited you to join "
                f"the project "
                f"'{invitation.project.name}' "
                f"on JiraLite.\n\n"

                f"Open this invitation:\n"
                f"{invitation_url}\n\n"

                f"This invitation expires at "
                f"{invitation.expires_at}.\n\n"

                "If you did not expect this invitation, "
                "you can ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[
                invitation.invited_user.email
            ],
            fail_silently=False,
        )

    except Exception as exc:
        raise InvitationEmailDeliveryError(
            "Invitation email could not be sent."
        ) from exc

    if sent_count != 1:
        raise InvitationEmailDeliveryError(
            "Email backend did not confirm delivery."
        )

    return True