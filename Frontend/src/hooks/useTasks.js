import { useCallback, useEffect, useState } from 'react'

import { createTask, getTasks } from '../services/taskService'

const INITIAL_FORM_DATA = {
  title: '',
  project: '',
  assignedTo: '',
  priority: '',
  status: '',
  dueDate: '',
  description: '',
}

export const TASK_PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [projectOptions, setProjectOptions] = useState([])
  const [assigneeOptions, setAssigneeOptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [listError, setListError] = useState('')
  const [createError, setCreateError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setListError('')

    try {
      const response = await getTasks()
      setTasks(response.tasks)
      setTotalCount(response.count)
      setProjectOptions(response.projectOptions)
      setAssigneeOptions(response.assigneeOptions)
    } catch (error) {
      setListError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const openCreateModal = () => {
    setCreateError('')
    setFormData(INITIAL_FORM_DATA)
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isCreating) {
      return
    }

    setCreateError('')
    setFormData(INITIAL_FORM_DATA)
    setIsCreateModalOpen(false)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    if (createError) {
      setCreateError('')
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      await createTask(formData)
      setIsCreateModalOpen(false)
      setFormData(INITIAL_FORM_DATA)
      await loadTasks()
    } catch (error) {
      setCreateError(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  return {
    assigneeOptions,
    closeCreateModal,
    createError,
    formData,
    handleCreateTask,
    handleFormChange,
    isCreateModalOpen,
    isCreating,
    isLoading,
    listError,
    openCreateModal,
    projectOptions,
    refreshTasks: loadTasks,
    tasks,
    totalCount,
  }
}
