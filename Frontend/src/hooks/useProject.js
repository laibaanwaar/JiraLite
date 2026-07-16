import { useEffect, useRef, useState } from 'react'
import { getProject, normalizeProjectError } from '../services/projectService.js'

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

export default function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    setIsLoading(true)
    setErrorMessage('')

    getProject(projectId, undefined, { signal: controller.signal })
      .then((response) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setProject(response.project)
      })
      .catch((error) => {
        const normalized = normalizeProjectError(error)

        if (normalized.canceled || requestId !== requestIdRef.current) {
          return
        }

        if (normalized.shouldRedirectToLogin) {
          redirectToLogin(normalized.message)
          return
        }

        setProject(null)
        setErrorMessage(normalized.message || 'Unable to load project.')
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [projectId])

  return {
    errorMessage,
    isLoading,
    project,
  }
}
