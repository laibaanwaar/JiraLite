import logging
from typing import Any, cast

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.paginator import EmptyPage, Paginator
from django.core.validators import validate_email
from django.db import DatabaseError, IntegrityError, transaction
from django.db.models import Count, Q, QuerySet
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import UserProfile
from accounts.services.exceptions import EmailDeliveryError
from accounts.services.user_payload_service import build_user_payload, get_role_by_code
from projects.models import Project, ProjectInvitation, ProjectMember
from projects.services.email_service import ProjectInvitationEmailService


logger = logging.getLogger(__name__)
User = get_user_model()


class ProjectPermissionError(PermissionError):
    pass


class ProjectNotFoundError(LookupError):
    pass


class ProjectService:
    ADMIN_ROLES = {ProjectMember.ROLE_OWNER, ProjectMember.ROLE_ADMIN}
    OWNER_ROLES = {ProjectMember.ROLE_OWNER}
    VALID_ROLE_FILTERS = {ProjectMember.ROLE_OWNER, ProjectMember.ROLE_ADMIN, ProjectMember.ROLE_MEMBER}
    VALID_ORDERING_FIELDS = {
        "created_at": "project__created_at",
        "-created_at": "-project__created_at",
        "updated_at": "project__updated_at",
        "-updated_at": "-project__updated_at",
        "name": "project__name",
        "-name": "-project__name",
    }

    @staticmethod
    def _project_membership_queryset(*, user) -> QuerySet[ProjectMember]:
        return (
            ProjectMember.objects.select_related("project")
            .filter(user=user, project__is_active=True)
            .annotate(
                total_members=Count("project__members", filter=Q(project__members__user__is_active=True), distinct=True),
                total_tasks=Count("project__tasks", filter=Q(project__tasks__is_active=True), distinct=True),
            )
        )

    @staticmethod
    def _apply_project_list_filters(queryset: QuerySet[ProjectMember], *, params) -> QuerySet[ProjectMember]:
        role = params.get("role")
        if role:
            normalized_role = str(role).strip().upper()
            if normalized_role not in ProjectService.VALID_ROLE_FILTERS:
                raise ValidationError({"role": ["Allowed values are OWNER, ADMIN, and MEMBER."]})
            queryset = queryset.filter(role=normalized_role)

        search = params.get("search")
        if search is not None and not isinstance(search, str):
            raise ValidationError({"search": ["Search must be a string."]})
        normalized_search = (search or "").strip()
        if len(normalized_search) > 200:
            raise ValidationError({"search": ["Search must be 200 characters or fewer."]})
        if normalized_search:
            queryset = queryset.filter(
                Q(project__name__icontains=normalized_search)
                | Q(project__description__icontains=normalized_search)
            )

        ordering = (params.get("ordering") or "-updated_at").strip()
        if ordering not in ProjectService.VALID_ORDERING_FIELDS:
            raise ValidationError({"ordering": ["Invalid ordering value."]})
        return queryset.order_by(ProjectService.VALID_ORDERING_FIELDS[ordering], "project__id")

    @staticmethod
    def _paginate_queryset(queryset: QuerySet[ProjectMember], *, params, request=None) -> dict:
        page = params.get("page", 1)
        page_size = params.get("page_size", 10)

        try:
            page_number = int(page)
            page_size_number = int(page_size)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"page": ["page and page_size must be positive integers."]}) from exc

        if page_number < 1:
            raise ValidationError({"page": ["page must be a positive integer."]})
        if page_size_number < 1 or page_size_number > 50:
            raise ValidationError({"page_size": ["page_size must be between 1 and 50."]})

        paginator = Paginator(queryset, page_size_number)
        try:
            page_obj = paginator.page(page_number)
        except EmptyPage as exc:
            raise ValidationError({"page": ["Invalid page number."]}) from exc

        def build_page_url(target_page):
            if request is None:
                return None
            query_params = request.GET.copy()
            query_params["page"] = target_page
            query_params["page_size"] = page_size_number
            return request.build_absolute_uri(f"{request.path}?{query_params.urlencode()}")

        return {
            "count": paginator.count,
            "next": build_page_url(page_obj.next_page_number()) if page_obj.has_next() else None,
            "previous": build_page_url(page_obj.previous_page_number()) if page_obj.has_previous() else None,
            "results": list(page_obj.object_list),
        }

    @staticmethod
    def _get_invitation_by_token(*, token: str) -> ProjectInvitation:
        token_hash = ProjectInvitationEmailService.hash_token(token.strip())
        try:
            return ProjectInvitation.objects.select_related("project", "invited_by").get(token_hash=token_hash)
        except ProjectInvitation.DoesNotExist as exc:
            raise ValidationError({"token": ["Invalid invitation token."]}) from exc

    @staticmethod
    def _get_invitation_for_update(*, token: str) -> ProjectInvitation:
        token_hash = ProjectInvitationEmailService.hash_token(token.strip())
        try:
            return (
                cast(Any, ProjectInvitation.objects)
                .select_for_update()
                .select_related("project", "invited_by")
                .get(token_hash=token_hash)
            )
        except ProjectInvitation.DoesNotExist as exc:
            raise ValidationError({"token": ["Invalid invitation token."]}) from exc

    @staticmethod
    def _mark_invitation_expired_if_needed(*, invitation: ProjectInvitation) -> None:
        if invitation.status == ProjectInvitation.STATUS_PENDING and invitation.expires_at <= timezone.now():
            invitation.status = ProjectInvitation.STATUS_EXPIRED
            invitation.save(update_fields=["status", "updated_at"])

    @staticmethod
    def _validate_pending_invitation(*, invitation: ProjectInvitation) -> None:
        if not invitation.project.is_active:
            raise ValidationError({"token": ["This invitation is no longer available."]})

        ProjectService._mark_invitation_expired_if_needed(invitation=invitation)

        if invitation.status != ProjectInvitation.STATUS_PENDING:
            raise ValidationError({"token": ["This invitation is no longer pending."]})

    @staticmethod
    def _build_invitation_preview_payload(*, invitation: ProjectInvitation) -> dict:
        if not invitation.project.is_active:
            raise ValidationError({"token": ["This invitation is no longer available."]})

        status_message = None
        ProjectService._mark_invitation_expired_if_needed(invitation=invitation)

        if invitation.status == ProjectInvitation.STATUS_EXPIRED:
            status_message = "This invitation has expired."
        elif invitation.status == ProjectInvitation.STATUS_ACCEPTED:
            status_message = "This invitation has already been accepted."
        elif invitation.status == ProjectInvitation.STATUS_REJECTED:
            status_message = "This invitation has already been rejected."
        elif invitation.status == ProjectInvitation.STATUS_CANCELLED:
            status_message = "This invitation has been cancelled."

        normalized_invited_email = invitation.invited_email.strip().lower()
        account_exists = User.objects.filter(
            email__iexact=invitation.invited_email.strip(),
            is_active=True,
        ).exists()

        logger.debug(
            "Invitation preview: invited_email=%s account_exists=%s status=%s",
            normalized_invited_email,
            account_exists,
            invitation.status,
        )

        return {
            "success": True,
            "message": "Invitation preview retrieved successfully.",
            "data": {
                "email": normalized_invited_email,
                "status": invitation.status,
                "status_message": status_message,
                "project": {
                    "id": invitation.project.id,
                    "name": invitation.project.name,
                    "description": invitation.project.description,
                },
                "inviter_name": f"{invitation.invited_by.first_name} {invitation.invited_by.last_name}".strip()
                or invitation.invited_by.email,
                "inviter": {
                    "name": f"{invitation.invited_by.first_name} {invitation.invited_by.last_name}".strip()
                    or invitation.invited_by.email,
                },
                "project_role": invitation.project_role,
                "invited_email": normalized_invited_email,
                "role": invitation.project_role,
                "message": invitation.message,
                "invited_by": {
                    "id": invitation.invited_by.id,
                    "first_name": invitation.invited_by.first_name,
                    "last_name": invitation.invited_by.last_name,
                    "email": invitation.invited_by.email,
                },
                "expires_at": invitation.expires_at,
                "expired": invitation.status == ProjectInvitation.STATUS_EXPIRED,
                "account_exists": account_exists,
                "has_active_account": account_exists,
                "show_name_password_form": invitation.status == ProjectInvitation.STATUS_PENDING,
                "can_accept": invitation.status == ProjectInvitation.STATUS_PENDING,
                "can_reject": invitation.status == ProjectInvitation.STATUS_PENDING,
            },
        }

    @staticmethod
    def get_invitation_preview_by_token(*, token: str) -> dict:
        invitation = ProjectService._get_invitation_by_token(token=token)
        return ProjectService._build_invitation_preview_payload(invitation=invitation)

    @staticmethod
    def get_pending_invitation_details_by_token(*, token: str) -> dict:
        invitation = ProjectService._get_invitation_by_token(token=token)
        ProjectService._validate_pending_invitation(invitation=invitation)
        return ProjectService._build_invitation_preview_payload(invitation=invitation)

    @staticmethod
    def get_invitation_preview(*, user, token: str) -> dict:
        invitation = ProjectService._get_invitation_by_token(token=token)
        return ProjectService._build_invitation_preview_payload(invitation=invitation)

    @staticmethod
    def _get_project_membership(*, user, project_id: int) -> ProjectMember:
        try:
            return ProjectMember.objects.select_related("project").get(
                project_id=project_id,
                user=user,
                project__is_active=True,
            )
        except ProjectMember.DoesNotExist as exc:
            if Project.objects.filter(id=project_id, is_active=True).exists():
                raise ProjectPermissionError("You are not a member of this project.") from exc
            raise ProjectNotFoundError("Project not found.") from exc

    @staticmethod
    def list_project_members(*, user, project_id: int) -> dict:
        try:
            membership = ProjectMember.objects.select_related("project").get(
                project_id=project_id,
                user=user,
                project__is_active=True,
            )
        except ProjectMember.DoesNotExist as exc:
            raise PermissionError("You are not allowed to access this project's members.") from exc

        members = list(
            ProjectMember.objects.select_related("user")
            .filter(project_id=membership.project_id, user__is_active=True)
            .order_by("user__first_name", "user__last_name", "id")
        )

        return {
            "success": True,
            "message": "Project members retrieved successfully.",
            "data": members,
        }

    @staticmethod
    def list_projects(*, user, params, request=None) -> dict:
        queryset = ProjectService._project_membership_queryset(user=user)
        filtered = ProjectService._apply_project_list_filters(queryset, params=params)
        page_data = ProjectService._paginate_queryset(filtered, params=params, request=request)
        return {
            "success": True,
            "message": "Projects retrieved successfully.",
            "data": page_data,
        }

    @staticmethod
    def get_project_detail(*, user, project_id: int) -> ProjectMember:
        try:
            return ProjectService._project_membership_queryset(user=user).get(project_id=project_id)
        except ProjectMember.DoesNotExist as exc:
            if Project.objects.filter(id=project_id, is_active=True).exists():
                raise ProjectPermissionError("You are not a member of this project.") from exc
            raise ProjectNotFoundError("Project not found.") from exc

    @staticmethod
    def update_project(*, user, project_id: int, validated_data: dict) -> ProjectMember:
        with cast(Any, transaction).atomic():
            try:
                membership = (
                    ProjectMember.objects.select_related("project")
                    .select_for_update(of=("self", "project"))
                    .get(user=user, project_id=project_id, project__is_active=True)
                )
            except ProjectMember.DoesNotExist as exc:
                if Project.objects.filter(id=project_id, is_active=True).exists():
                    raise ProjectPermissionError("You are not a member of this project.") from exc
                raise ProjectNotFoundError("Project not found.") from exc

            if membership.role not in ProjectService.ADMIN_ROLES:
                raise ProjectPermissionError("You do not have permission to update this project.")

            project = membership.project
            if "name" in validated_data:
                project.name = validated_data["name"]
            if "description" in validated_data:
                project.description = validated_data["description"]
            project.save()

        return ProjectService.get_project_detail(user=user, project_id=project_id)

    @staticmethod
    def delete_project(*, user, project_id: int) -> None:
        with cast(Any, transaction).atomic():
            try:
                membership = (
                    ProjectMember.objects.select_related("project")
                    .select_for_update(of=("self", "project"))
                    .get(user=user, project_id=project_id, project__is_active=True)
                )
            except ProjectMember.DoesNotExist as exc:
                if Project.objects.filter(id=project_id, is_active=True).exists():
                    raise ProjectPermissionError("You are not a member of this project.") from exc
                raise ProjectNotFoundError("Project not found.") from exc

            if membership.role not in ProjectService.OWNER_ROLES:
                raise ProjectPermissionError("Only the project owner can delete this project.")

            project = membership.project
            project.is_active = False
            project.save(update_fields=["is_active", "updated_at"])

    @staticmethod
    def _normalize_invite_emails(*, invite_emails, owner_email: str) -> list[str]:
        if invite_emails in (None, ""):
            return []
        if not isinstance(invite_emails, list):
            raise ValidationError({"invite_emails": ["invite_emails must be a list."]})
        if len(invite_emails) > 20:
            raise ValidationError({"invite_emails": ["You can invite at most 20 emails at a time."]})

        unique_emails: list[str] = []
        seen = set()
        for raw_email in invite_emails:
            if not isinstance(raw_email, str):
                raise ValidationError({"invite_emails": ["Each invited email must be a string."]})
            normalized = raw_email.strip().lower()
            validate_email(normalized)
            if normalized == owner_email:
                raise ValidationError({"message": ["You cannot invite yourself to your own project."]})
            if normalized not in seen:
                seen.add(normalized)
                unique_emails.append(normalized)
        return unique_emails

    @staticmethod
    def _build_project_payload(project: Project, invitations: list[ProjectInvitation]) -> dict:
        invitation_items = [
            {
                "email": invitation.invited_email,
                "status": invitation.status,
                "email_status": invitation.email_status,
            }
            for invitation in invitations
        ]
        return {
            "project": {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "current_user_role": ProjectMember.ROLE_OWNER,
            },
            "invitation_count": len(invitation_items),
            "invited_emails": [item["email"] for item in invitation_items],
            "invitations": invitation_items,
        }

    @staticmethod
    def create_project(*, user, name: str, description: str = "", invite_emails=None, message: str = "") -> dict:
        normalized_owner_email = user.email.strip().lower()
        normalized_invite_emails = ProjectService._normalize_invite_emails(
            invite_emails=invite_emails,
            owner_email=normalized_owner_email,
        )

        raw_tokens_by_invitation_email: dict[str, str] = {}
        invitations: list[ProjectInvitation] = []

        with cast(Any, transaction).atomic():
            project = Project.objects.create(
                name=name.strip(),
                description=(description or "").strip(),
                created_by=user,
                is_active=True,
            )
            ProjectMember.objects.create(
                project=project,
                user=user,
                role=ProjectMember.ROLE_OWNER,
            )

            for invited_email in normalized_invite_emails:
                raw_token = ProjectInvitationEmailService.generate_token()
                token_hash = ProjectInvitationEmailService.hash_token(raw_token)
                invitation = ProjectInvitation.objects.create(
                    project=project,
                    invited_by=user,
                    invited_email=invited_email,
                    message=(message or "").strip(),
                    project_role=ProjectMember.ROLE_MEMBER,
                    token_hash=token_hash,
                    status=ProjectInvitation.STATUS_PENDING,
                    email_status=ProjectInvitation.EMAIL_PENDING,
                    expires_at=ProjectInvitationEmailService.get_expiry(),
                )
                raw_tokens_by_invitation_email[invited_email] = raw_token
                invitations.append(invitation)

        failed_invitations: list[str] = []
        inviter_name = f"{user.first_name} {user.last_name}".strip() or user.email
        for invitation in invitations:
            raw_token = raw_tokens_by_invitation_email[invitation.invited_email]
            try:
                ProjectInvitationEmailService.send_invitation_email(
                    invitation=invitation,
                    inviter_name=inviter_name,
                    project_name=project.name,
                    token=raw_token,
                )
            except EmailDeliveryError:
                invitation.email_status = ProjectInvitation.EMAIL_FAILED
                invitation.save(update_fields=["email_status", "updated_at"])
                failed_invitations.append(invitation.invited_email)
            else:
                invitation.email_status = ProjectInvitation.EMAIL_SENT
                invitation.save(update_fields=["email_status", "updated_at"])

        refreshed_invitations = list(ProjectInvitation.objects.filter(project=project).order_by("id"))
        if failed_invitations:
            return {
                "success": True,
                "message": "Project created, but some invitations could not be sent.",
                "data": {
                    **ProjectService._build_project_payload(project, refreshed_invitations),
                    "failed_invitations": failed_invitations,
                },
            }

        return {
            "success": True,
            "message": "Project created successfully.",
            "data": ProjectService._build_project_payload(project, refreshed_invitations),
        }

    @staticmethod
    def create_project_invitation(*, user, project_id: int, email: str, project_role: str | None = None) -> dict:
        membership = ProjectService._get_project_membership(user=user, project_id=project_id)
        if membership.role not in ProjectService.ADMIN_ROLES:
            raise ProjectPermissionError("Only the project owner or admin can send invitations.")

        normalized_email = email.strip().lower()
        validate_email(normalized_email)
        if normalized_email == user.email.strip().lower():
            raise ValidationError({"email": ["You cannot invite yourself to your own project."]})

        normalized_project_role = (project_role or ProjectMember.ROLE_MEMBER).strip().upper()
        if normalized_project_role not in {ProjectMember.ROLE_ADMIN, ProjectMember.ROLE_MEMBER}:
            raise ValidationError({"project_role": ["Allowed values are ADMIN and MEMBER."]})

        existing_user = User.objects.filter(email__iexact=normalized_email).first()
        if existing_user and ProjectMember.objects.filter(project=membership.project, user=existing_user).exists():
            raise IntegrityError("User is already a project member.")

        now = timezone.now()
        with cast(Any, transaction).atomic():
            cast(Any, ProjectInvitation.objects).select_for_update().filter(
                project=membership.project,
                invited_email=normalized_email,
                status=ProjectInvitation.STATUS_PENDING,
                expires_at__lte=now,
            ).update(status=ProjectInvitation.STATUS_EXPIRED, updated_at=now)

            if ProjectInvitation.objects.filter(
                project=membership.project,
                invited_email=normalized_email,
                status=ProjectInvitation.STATUS_PENDING,
                expires_at__gt=now,
            ).exists():
                raise ValidationError({"email": ["A pending invitation already exists for this email."]})

            raw_token = ProjectInvitationEmailService.generate_token()
            invitation = ProjectInvitation.objects.create(
                project=membership.project,
                invited_by=user,
                invited_email=normalized_email,
                project_role=normalized_project_role,
                token_hash=ProjectInvitationEmailService.hash_token(raw_token),
                status=ProjectInvitation.STATUS_PENDING,
                email_status=ProjectInvitation.EMAIL_PENDING,
                expires_at=ProjectInvitationEmailService.get_expiry(),
            )

        inviter_name = f"{user.first_name} {user.last_name}".strip() or user.email
        try:
            ProjectInvitationEmailService.send_invitation_email(
                invitation=invitation,
                inviter_name=inviter_name,
                project_name=membership.project.name,
                token=raw_token,
            )
        except EmailDeliveryError:
            invitation.email_status = ProjectInvitation.EMAIL_FAILED
            invitation.save(update_fields=["email_status", "updated_at"])
            raise

        invitation.email_status = ProjectInvitation.EMAIL_SENT
        invitation.save(update_fields=["email_status", "updated_at"])
        return {
            "success": True,
            "message": "Invitation sent successfully.",
            "data": {
                "id": invitation.id,
                "project": {
                    "id": membership.project.id,
                    "name": membership.project.name,
                },
                "invited_email": invitation.invited_email,
                "project_role": invitation.project_role,
                "status": invitation.status,
                "expires_at": invitation.expires_at,
                "created_at": invitation.created_at,
            },
        }

    @staticmethod
    def accept_invitation(*, user, token: str) -> dict:
        with cast(Any, transaction).atomic():
            invitation = ProjectService._get_invitation_for_update(token=token)
            ProjectService._validate_pending_invitation(invitation=invitation)

            normalized_invited_email = invitation.invited_email.strip().lower()
            normalized_user_email = user.email.strip().lower()
            logger.debug(
                "Invitation accept existing account: invited_email=%s authenticated_user_email=%s status=%s",
                normalized_invited_email,
                normalized_user_email,
                invitation.status,
            )

            if normalized_invited_email != normalized_user_email:
                raise PermissionError("The logged-in email does not match the invited email.")

            if ProjectMember.objects.filter(project=invitation.project, user=user).exists():
                raise IntegrityError("User is already a project member.")

            membership = ProjectMember.objects.create(
                project=invitation.project,
                user=user,
                role=invitation.project_role,
            )
            invitation.status = ProjectInvitation.STATUS_ACCEPTED
            invitation.accepted_by = user
            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=["status", "accepted_by", "accepted_at", "updated_at"])

        return {
            "success": True,
            "message": "Invitation accepted successfully.",
            "data": {
                "project_id": membership.project_id,
                "role": membership.role,
            },
        }

    @staticmethod
    def accept_invitation_by_token(*, token: str) -> dict:
        with cast(Any, transaction).atomic():
            invitation = ProjectService._get_invitation_for_update(token=token)
            ProjectService._validate_pending_invitation(invitation=invitation)
        raise ValidationError(
            {
                "invited_email": [
                    "Accept this invitation from the invitation API so existing users can log in and new users can set a password."
                ]
            }
        )

    @staticmethod
    def accept_invitation_for_new_user(
        *,
        token: str,
        first_name: str,
        last_name: str,
        password: str,
        confirm_password: str,
    ) -> dict:
        from django.contrib.auth.password_validation import validate_password

        if password != confirm_password:
            raise ValidationError({"confirm_password": ["Passwords do not match."]})

        with cast(Any, transaction).atomic():
            invitation = ProjectService._get_invitation_for_update(token=token)
            ProjectService._validate_pending_invitation(invitation=invitation)

            normalized_invited_email = invitation.invited_email.strip().lower()
            invited_user = (
                cast(Any, User.objects)
                .select_for_update()
                .filter(email=normalized_invited_email)
                .first()
            )
            logger.debug(
                "Invitation accept new account: invited_email=%s account_exists=%s status=%s",
                normalized_invited_email,
                invited_user is not None,
                invitation.status,
            )

            probe_user = invited_user or User(
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                email=normalized_invited_email,
            )
            try:
                validate_password(password, user=probe_user)
            except ValidationError as exc:
                raise ValidationError({"password": exc.messages}) from exc

            member_role = get_role_by_code(code="MEMBER")
            if invited_user is None:
                invited_user = cast(Any, User.objects).create_user(
                    first_name=first_name.strip(),
                    last_name=last_name.strip(),
                    email=normalized_invited_email,
                    password=password,
                    role=member_role,
                    is_email_verified=True,
                    is_active=True,
                )
                UserProfile.objects.create(user=invited_user)
            else:
                invited_user.first_name = first_name.strip()
                invited_user.last_name = last_name.strip()
                invited_user.email = normalized_invited_email
                invited_user.role = member_role
                invited_user.is_email_verified = True
                invited_user.is_active = True
                invited_user.set_password(password)
                invited_user.save(
                    update_fields=[
                        "first_name",
                        "last_name",
                        "email",
                        "role",
                        "is_email_verified",
                        "is_active",
                        "password",
                        "updated_at",
                    ]
                )
                UserProfile.objects.get_or_create(user=invited_user)

            if ProjectMember.objects.filter(project=invitation.project, user=invited_user).exists():
                raise IntegrityError("User is already a project member.")

            membership = ProjectMember.objects.create(
                project=invitation.project,
                user=invited_user,
                role=invitation.project_role,
            )
            invitation.status = ProjectInvitation.STATUS_ACCEPTED
            invitation.accepted_by = invited_user
            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=["status", "accepted_by", "accepted_at", "updated_at"])

        refresh = RefreshToken.for_user(invited_user)
        return {
            "success": True,
            "message": "Invitation accepted successfully.",
            "data": {
                "project_id": membership.project_id,
                "role": membership.role,
                "email": invited_user.email,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": build_user_payload(invited_user),
            },
        }

    @staticmethod
    def reject_invitation(*, user, token: str) -> dict:
        with cast(Any, transaction).atomic():
            invitation = ProjectService._get_invitation_for_update(token=token)
            if invitation.invited_email.strip().lower() != user.email.strip().lower():
                raise PermissionError("The logged-in email does not match the invited email.")
            ProjectService._validate_pending_invitation(invitation=invitation)

            invitation.status = ProjectInvitation.STATUS_REJECTED
            invitation.rejected_at = timezone.now()
            invitation.save(update_fields=["status", "rejected_at", "updated_at"])

        return {
            "success": True,
            "message": "Invitation rejected successfully.",
            "data": {
                "project_id": invitation.project_id,
                "status": invitation.status,
            },
        }

    @staticmethod
    def reject_invitation_by_token(*, token: str) -> dict:
        with cast(Any, transaction).atomic():
            invitation = ProjectService._get_invitation_for_update(token=token)
            ProjectService._validate_pending_invitation(invitation=invitation)

            invitation.status = ProjectInvitation.STATUS_REJECTED
            invitation.rejected_at = timezone.now()
            invitation.save(update_fields=["status", "rejected_at", "updated_at"])

        return {
            "success": True,
            "message": "Invitation rejected successfully.",
            "data": {
                "project_id": invitation.project_id,
                "status": invitation.status,
            },
        }
