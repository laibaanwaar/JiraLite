import { useEffect, useState } from 'react'
import { getProjectMembers } from '../services/projectService.js'
import { normalizeTaskError } from '../services/taskService.js'

export default function useProjectMembers(projectId) {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!projectId) {
      setMembers([])
      setErrorMessage('')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setErrorMessage('')

    getProjectMembers(projectId, undefined, { signal: controller.signal })
      .then((response) => {
        setMembers(response.results)
      })
      .catch((error) => {
        const normalized = normalizeTaskError(error)

        if (normalized.canceled) {
          return
        }

        setMembers([])
        if (normalized.status === 404) {
          setErrorMessage('Unable to load members for the selected project.')
          return
        }

        if (normalized.status === 403) {
          setErrorMessage('You do not have permission to view members for this project.')
          return
        }

        setErrorMessage(normalized.message || 'Unable to load members for the selected project.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [projectId])

  return {
    errorMessage,
    isLoading,
    members,
  }
}
