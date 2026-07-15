import { useCallback, useEffect, useMemo, useState } from 'react'

import { getProjectMembers, getProjects } from '../services/projectService'
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

const DEFAULT_PROJECT_FILTER_OPTION = {
  value: '',
  label: 'All Projects',
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

function getProjectMemberLabel(member) {
  return [member.first_name, member.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
}

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [projectOptions, setProjectOptions] = useState([])
  const [projectFilterOptions, setProjectFilterOptions] = useState([DEFAULT_PROJECT_FILTER_OPTION])
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_PROJECT_FILTER_OPTION.value)
  const [projectMembers, setProjectMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [createError, setCreateError] = useState('')
  const [projectFilterError, setProjectFilterError] = useState('')
  const [assigneeError, setAssigneeError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setListError('')

    try {
      const response = await getTasks()
      setTasks(response.tasks)
      setTotalCount(response.count)
    } catch (error) {
      setListError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const loadProjects = useCallback(async () => {
    setIsProjectsLoading(true)
    setProjectFilterError('')

    try {
      const response = await getProjects()
      const normalizedProjectOptions = response.projects.map((project) => ({
        value: String(project.id),
        label: project.name,
      }))

      setProjectOptions(normalizedProjectOptions)
      setProjectFilterOptions([DEFAULT_PROJECT_FILTER_OPTION, ...normalizedProjectOptions])
    } catch (error) {
      setProjectOptions([])
      setProjectFilterOptions([DEFAULT_PROJECT_FILTER_OPTION])
      setProjectFilterError(error.message)
    } finally {
      setIsProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const loadProjectMembers = useCallback(async (projectId) => {
    if (!projectId) {
      setProjectMembers([])
      setAssigneeError('')
      setIsUsersLoading(false)
      return
    }

    setIsUsersLoading(true)
    setAssigneeError('')

    try {
      const response = await getProjectMembers(projectId)
      setProjectMembers(response.members)
    } catch (error) {
      setProjectMembers([])
      setAssigneeError(error.message)
    } finally {
      setIsUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    const syncProjectMembers = async () => {
      if (!formData.project) {
        setProjectMembers([])
        setAssigneeError('')
        setIsUsersLoading(false)
        return
      }

      setIsUsersLoading(true)
      setAssigneeError('')

      try {
        const response = await getProjectMembers(formData.project)

        if (!isCurrent) {
          return
        }

        setProjectMembers(response.members)
      } catch (error) {
        if (!isCurrent) {
          return
        }

        setProjectMembers([])
        setAssigneeError(error.message)
      } finally {
        if (isCurrent) {
          setIsUsersLoading(false)
        }
      }
    }

    syncProjectMembers()

    return () => {
      isCurrent = false
    }
  }, [formData.project])

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

    setFormData((current) => {
      if (name === 'project') {
        return {
          ...current,
          project: value,
          assignedTo: '',
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })
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

  const handleProjectSelection = (event) => {
    setSelectedProjectId(event.target.value)
  }

  const assigneeOptions = useMemo(() => {
    if (!formData.project) {
      return []
    }

    const seen = new Set()

    return projectMembers.reduce((options, member) => {
      const value = String(member.id ?? '')
      const label = getProjectMemberLabel(member) || member.name || ''

      if (!value || !label || seen.has(value)) {
        return options
      }

      seen.add(value)
      options.push({ value, label })

      return options
    }, [])
  }, [formData.project, projectMembers])

  return {
    assigneeOptions,
    closeCreateModal,
    createError,
    formData,
    handleCreateTask,
    handleFormChange,
    assigneeError,
    isCreateModalOpen,
    isCreating,
    isLoading,
    isProjectsLoading,
    isUsersLoading,
    listError,
    openCreateModal,
    projectOptions,
    projectFilterError,
    projectFilterOptions,
    refreshTasks: loadTasks,
    refreshProjects: loadProjects,
    refreshUsers: () => loadProjectMembers(formData.project),
    selectedProjectId,
    handleProjectSelection,
    tasks,
    totalCount,
  }
}
