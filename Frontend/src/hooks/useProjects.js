import { useCallback, useEffect, useState } from 'react'

import { assignProjectMember, createProject, getProjects } from '../services/projectService'
import { getUsers } from '../services/userService'

const INITIAL_FORM_DATA = {
  projectMembers: [],
  projectName: '',
  projectKey: '',
  description: '',
  projectOwner: '',
  startDate: '',
  endDate: '',
}

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [ownerOptions, setOwnerOptions] = useState([])
  const [memberOptions, setMemberOptions] = useState([])
  const [summary, setSummary] = useState({
    activeProjects: 0,
    archivedProjects: 0,
    averageCompletion: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [createError, setCreateError] = useState('')
  const [usersError, setUsersError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setListError('')

    try {
      const response = await getProjects()
      setProjects(response.projects)
      setSummary(response.summary)
      setTotalCount(response.totalCount)
    } catch (error) {
      setListError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true)
    setUsersError('')

    try {
      const response = await getUsers()
      const options = response.users.map((user) => ({
        value: String(user.id),
        label: user.name,
        description: user.email,
      }))

      setOwnerOptions(options)
      setMemberOptions(options)
    } catch (error) {
      setOwnerOptions([])
      setMemberOptions([])
      setUsersError(error.message)
    } finally {
      setIsUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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

  const handleProjectMembersChange = (selectedValues) => {
    if (createError) {
      setCreateError('')
    }

    const uniqueSelectedValues = [...new Set(selectedValues)]

    setFormData((current) => ({
      ...current,
      projectMembers: uniqueSelectedValues,
    }))
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const response = await createProject(formData)
      const projectId = response?.data?.id

      if (!projectId) {
        throw new Error('Project was created but no project ID was returned.')
      }

      const memberIdsToAssign = formData.projectMembers.filter(
        (userId) => String(userId) !== String(formData.projectOwner),
      )

      for (const userId of memberIdsToAssign) {
        await assignProjectMember(projectId, userId)
      }

      setIsCreateModalOpen(false)
      setFormData(INITIAL_FORM_DATA)
      await loadProjects()
    } catch (error) {
      setCreateError(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  return {
    closeCreateModal,
    createError,
    formData,
    handleCreateProject,
    handleFormChange,
    handleProjectMembersChange,
    isCreateModalOpen,
    isCreating,
    isLoading,
    isUsersLoading,
    listError,
    memberOptions,
    openCreateModal,
    ownerOptions,
    projects,
    refreshProjects: loadProjects,
    refreshUsers: loadUsers,
    summary,
    totalCount,
    usersError,
  }
}
