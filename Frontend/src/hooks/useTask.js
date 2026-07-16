import { useCallback, useEffect, useState } from 'react'
import { deleteTask, getTaskById, normalizeTaskError, updateTask } from '../services/taskService.js'

function redirectToLogin(message) {
  window.history.replaceState(
    {
      authNotice: {
        message,
        type: 'warning',
      },
    },
    '',
    '/login',
  )
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function useTask(taskId) {
  const [task, setTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const loadTask = useCallback(() => {
    if (!taskId) {
      setTask(null)
      setIsLoading(false)
      setErrorMessage('The requested project or task could not be found.')
      return Promise.resolve(null)
    }

    const controller = new AbortController()
    setIsLoading(true)
    setErrorMessage('')

    const request = getTaskById(taskId, { signal: controller.signal })
      .then((response) => {
        setTask(response.task)
        return response.task
      })
      .catch((error) => {
        const normalized = normalizeTaskError(error)

        if (normalized.canceled) {
          return null
        }

        if (normalized.shouldRedirectToLogin) {
          redirectToLogin(normalized.message)
          return null
        }

        setTask(null)
        setErrorMessage(normalized.message)
        return null
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    request.cancel = () => controller.abort()
    return request
  }, [taskId])

  useEffect(() => {
    const request = loadTask()

    return () => {
      request?.cancel?.()
    }
  }, [loadTask])

  const saveTask = useCallback(async (payload) => {
    setIsSaving(true)
    setErrorMessage('')
    setFieldErrors({})
    setSuccessMessage('')

    try {
      const response = await updateTask(taskId, payload)
      setTask(response.task)
      setSuccessMessage(response.message || 'Task updated successfully.')
      return { ok: true, task: response.task }
    } catch (error) {
      const normalized = normalizeTaskError(error)

      if (normalized.shouldRedirectToLogin) {
        redirectToLogin(normalized.message)
      } else {
        setErrorMessage(normalized.message)
        setFieldErrors(normalized.fieldErrors || {})
      }

      return { ok: false }
    } finally {
      setIsSaving(false)
    }
  }, [taskId])

  const removeTask = useCallback(async () => {
    setIsDeleting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await deleteTask(taskId)
      setSuccessMessage(response.message || 'Task deleted successfully.')
      return { ok: true, message: response.message }
    } catch (error) {
      const normalized = normalizeTaskError(error)

      if (normalized.shouldRedirectToLogin) {
        redirectToLogin(normalized.message)
      } else {
        setErrorMessage(normalized.message)
      }

      return { ok: false }
    } finally {
      setIsDeleting(false)
    }
  }, [taskId])

  return {
    errorMessage,
    fieldErrors,
    isDeleting,
    isLoading,
    isSaving,
    loadTask,
    removeTask,
    saveTask,
    setErrorMessage,
    setSuccessMessage,
    successMessage,
    task,
  }
}
