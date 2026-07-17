import { useEffect, useMemo, useState } from 'react'
import { getTaskComments } from '../services/taskService.js'

export default function useTaskCommentCounts(tasks = []) {
  const [counts, setCounts] = useState({})
  const taskIds = useMemo(() => tasks.map((task) => task?.id).filter(Boolean), [tasks])

  useEffect(() => {
    if (taskIds.length === 0) {
      setCounts({})
      return
    }

    const controller = new AbortController()

    Promise.all(
      taskIds.map((taskId) =>
        getTaskComments(taskId, { signal: controller.signal })
          .then((response) => [taskId, response.count])
          .catch(() => [taskId, 0]),
      ),
    ).then((entries) => {
      if (!controller.signal.aborted) {
        setCounts(Object.fromEntries(entries))
      }
    })

    return () => controller.abort()
  }, [taskIds])

  return counts
}
