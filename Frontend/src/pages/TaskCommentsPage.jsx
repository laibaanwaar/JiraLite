import { useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge.jsx'
import useTask from '../hooks/useTask.js'
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  normalizeTaskError,
  updateTaskComment,
} from '../services/taskService.js'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getInitials(author) {
  const first = author?.first_name?.charAt(0) || ''
  const last = author?.last_name?.charAt(0) || ''
  return `${first}${last}`.toUpperCase() || 'NA'
}

function getRoleLabel(role) {
  if (!role) {
    return 'Member'
  }

  return String(role).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

function formatDateTime(value) {
  if (!value) {
    return 'Just now'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function TaskCommentsPage({ taskId }) {
  const { errorMessage: taskError, isLoading: isLoadingTask, task } = useTask(taskId)
  const [comments, setComments] = useState([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [commentsError, setCommentsError] = useState('')
  const [content, setContent] = useState('')
  const [contentError, setContentError] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [deleteCommentId, setDeleteCommentId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!taskId) {
      setIsLoadingComments(false)
      setCommentsError('The requested task could not be found.')
      return
    }

    const controller = new AbortController()
    setIsLoadingComments(true)
    setCommentsError('')

    getTaskComments(taskId, { signal: controller.signal })
      .then((response) => setComments(response.results))
      .catch((error) => {
        const normalized = normalizeTaskError(error)

        if (!normalized.canceled) {
          setComments([])
          setCommentsError(normalized.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingComments(false)
        }
      })

    return () => controller.abort()
  }, [taskId])

  const submitComment = async (event) => {
    event.preventDefault()
    const nextContent = content.trim()

    if (!nextContent) {
      setContentError('Comment cannot be empty.')
      return
    }

    setIsSaving(true)
    setContentError('')
    setCommentsError('')

    try {
      const response = await createTaskComment(taskId, { content: nextContent })
      setComments((currentComments) => [...currentComments, response.comment])
      setContent('')
    } catch (error) {
      const normalized = normalizeTaskError(error)
      setContentError(normalized.fieldErrors?.content || normalized.message)
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
    setContentError('')
    setCommentsError('')
  }

  const saveEdit = async (commentId) => {
    const nextContent = editContent.trim()

    if (!nextContent) {
      setCommentsError('Comment cannot be empty.')
      return
    }

    setIsSaving(true)
    setCommentsError('')

    try {
      const response = await updateTaskComment(commentId, { content: nextContent })
      setComments((currentComments) =>
        currentComments.map((comment) => (comment.id === commentId ? response.comment : comment)),
      )
      setEditingCommentId(null)
      setEditContent('')
    } catch (error) {
      const normalized = normalizeTaskError(error)
      setCommentsError(normalized.message)
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteCommentId) {
      return
    }

    setIsDeleting(true)
    setCommentsError('')

    try {
      await deleteTaskComment(deleteCommentId)
      setComments((currentComments) => currentComments.filter((comment) => comment.id !== deleteCommentId))
      setDeleteCommentId(null)
    } catch (error) {
      const normalized = normalizeTaskError(error)
      setCommentsError(normalized.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppShell activePath="/projects">
      <section aria-labelledby="task-comments-title">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 id="task-comments-title" className="m-0 text-3xl font-extrabold text-slate-900">
            Task Comments
          </h1>
          <button
            type="button"
            onClick={() => navigateTo(task?.id ? `/tasks/${task.id}` : '/projects')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            Back to Task
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
          {isLoadingTask ? <p className="text-sm font-semibold text-slate-500">Loading task...</p> : null}
          {taskError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{taskError}</p> : null}

          {task ? (
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="m-0 text-2xl font-extrabold text-slate-900">{task.title}</h2>
                <p className="m-0 mt-2 text-sm font-semibold text-slate-500">{task.description || 'No description provided.'}</p>
              </div>
              <TaskStatusBadge status={task.status} />
            </div>
          ) : null}

          <div className="mt-6">
            <h3 className="m-0 text-lg font-extrabold text-slate-900">Comments ({comments.length})</h3>

            {isLoadingComments ? <p className="mt-4 text-sm font-semibold text-slate-500">Loading comments...</p> : null}
            {commentsError ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {commentsError}
              </p>
            ) : null}

            {!isLoadingComments && comments.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-500">
                No comments yet.
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4b36f4] text-sm font-extrabold text-white">
                      {getInitials(comment.author)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="m-0 text-sm font-extrabold text-slate-900">{comment.author.name}</p>
                        <span className="rounded-lg bg-[#efe8ff] px-2.5 py-1 text-xs font-extrabold text-[#5b35f5]">
                          {getRoleLabel(comment.author.role)}
                        </span>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-3">
                          <textarea
                            value={editContent}
                            onChange={(event) => setEditContent(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(comment.id)}
                              disabled={isSaving}
                              className="rounded-lg bg-[#4b36f4] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#3827d9] disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="m-0 mt-2 text-sm font-semibold leading-6 text-slate-700">{comment.content}</p>
                      )}

                      <p className="m-0 mt-2 text-xs font-semibold text-slate-500">{formatDateTime(comment.created_at)}</p>
                    </div>

                    {comment.can_edit || comment.can_delete ? (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {comment.can_edit ? (
                          <button
                            type="button"
                            onClick={() => startEdit(comment)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                        {comment.can_delete ? (
                          <button
                            type="button"
                            onClick={() => setDeleteCommentId(comment.id)}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <form className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submitComment}>
            <label htmlFor="newTaskComment" className="text-sm font-extrabold text-slate-800">
              Add comment
            </label>
            <textarea
              id="newTaskComment"
              value={content}
              onChange={(event) => {
                setContent(event.target.value)
                setContentError('')
              }}
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
              placeholder="Write a comment..."
            />
            {contentError ? <p className="mt-2 text-sm font-semibold text-rose-600">{contentError}</p> : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>

        {deleteCommentId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
              <h2 className="m-0 text-xl font-extrabold text-slate-900">Delete comment?</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">This action cannot be undone.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCommentId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
