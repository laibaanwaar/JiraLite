import logging
from typing import Any, cast

from django.core.exceptions import ValidationError
from django.db import transaction

from projects.models import ProjectMember, Task, TaskComment


logger = logging.getLogger(__name__)


class TaskCommentPermissionError(PermissionError):
    pass


class TaskCommentNotFoundError(LookupError):
    pass


class TaskCommentService:
    @staticmethod
    def _task_queryset():
        return Task.objects.select_related("project", "assignee", "assignee__user", "created_by")

    @staticmethod
    def _comment_queryset():
        return TaskComment.objects.select_related("task", "task__project", "author", "author__role")

    @staticmethod
    def _get_task(*, task_id: int) -> Task:
        try:
            return TaskCommentService._task_queryset().get(id=task_id, is_active=True, project__is_active=True)
        except Task.DoesNotExist as exc:
            raise TaskCommentNotFoundError("Task not found.") from exc

    @staticmethod
    def _get_comment(*, comment_id: int) -> TaskComment:
        try:
            return TaskCommentService._comment_queryset().get(id=comment_id, task__is_active=True, task__project__is_active=True)
        except TaskComment.DoesNotExist as exc:
            raise TaskCommentNotFoundError("Comment not found.") from exc

    @staticmethod
    def _get_membership(*, user, task: Task) -> ProjectMember:
        try:
            return ProjectMember.objects.select_related("project", "user").get(project=task.project, user=user)
        except ProjectMember.DoesNotExist as exc:
            raise TaskCommentPermissionError("You are not a member of this project.") from exc

    @staticmethod
    def _require_project_member(*, user, task: Task) -> None:
        TaskCommentService._get_membership(user=user, task=task)

    @staticmethod
    def _require_author(*, user, comment: TaskComment) -> None:
        if comment.author_id != user.id:
            raise TaskCommentPermissionError("You can only modify your own comments.")

    @staticmethod
    def list_comments(*, user, task_id: int) -> list[TaskComment]:
        task = TaskCommentService._get_task(task_id=task_id)
        TaskCommentService._require_project_member(user=user, task=task)
        return list(
            TaskCommentService._comment_queryset()
            .filter(task=task)
            .order_by("created_at", "id")
        )

    @staticmethod
    def create_comment(*, user, task_id: int, content: str) -> TaskComment:
        task = TaskCommentService._get_task(task_id=task_id)
        TaskCommentService._require_project_member(user=user, task=task)
        normalized_content = (content or "").strip()
        if not normalized_content:
            raise ValidationError({"content": ["Comment content cannot be blank."]})
        with cast(Any, transaction).atomic():
            comment = TaskComment.objects.create(
                task=task,
                author=user,
                content=normalized_content,
            )
        return TaskCommentService._comment_queryset().get(id=comment.id)

    @staticmethod
    def update_comment(*, user, comment_id: int, content: str) -> TaskComment:
        normalized_content = (content or "").strip()
        if not normalized_content:
            raise ValidationError({"content": ["Comment content cannot be blank."]})
        with cast(Any, transaction).atomic():
            try:
                comment = (
                    cast(Any, TaskComment.objects)
                    .select_for_update()
                    .select_related("task", "task__project", "author", "author__role")
                    .get(id=comment_id, task__is_active=True, task__project__is_active=True)
                )
            except TaskComment.DoesNotExist as exc:
                raise TaskCommentNotFoundError("Comment not found.") from exc
            TaskCommentService._require_project_member(user=user, task=comment.task)
            TaskCommentService._require_author(user=user, comment=comment)
            comment.content = normalized_content
            comment.save(update_fields=["content", "updated_at"])
        return TaskCommentService._comment_queryset().get(id=comment.id)

    @staticmethod
    def delete_comment(*, user, comment_id: int) -> None:
        with cast(Any, transaction).atomic():
            try:
                comment = (
                    cast(Any, TaskComment.objects)
                    .select_for_update()
                    .select_related("task", "task__project", "author")
                    .get(id=comment_id, task__is_active=True, task__project__is_active=True)
                )
            except TaskComment.DoesNotExist as exc:
                raise TaskCommentNotFoundError("Comment not found.") from exc
            TaskCommentService._require_project_member(user=user, task=comment.task)
            TaskCommentService._require_author(user=user, comment=comment)
            comment.delete()
