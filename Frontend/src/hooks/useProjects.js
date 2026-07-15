import { useCallback, useEffect, useState } from 'react'

import { createProject, getProjects } from '../services/projectService'

const INITIAL_FORM_DATA = {
  addUser: '',
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
  const [summary, setSummary] = useState({
    activeProjects: 0,
    archivedProjects: 0,
    averageCompletion: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [listError, setListError] = useState('')
  const [createError, setCreateError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setListError('')

    try {
      const response = await getProjects()
      setProjects(response.projects)
      setOwnerOptions(response.ownerOptions)
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

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      await createProject(formData)
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
    isCreateModalOpen,
    isCreating,
    isLoading,
    listError,
    openCreateModal,
    ownerOptions,
    projects,
    refreshProjects: loadProjects,
    summary,
    totalCount,
  }
}
