import axios from 'axios'

import api from './api'

function getMessageFromPayload(payload) {
  if (!payload) {
    return ''
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  const firstFieldError = Object.values(payload).find((value) => {
    if (Array.isArray(value)) {
      return typeof value[0] === 'string' && value[0].trim()
    }

    return typeof value === 'string' && value.trim()
  })

  if (Array.isArray(firstFieldError)) {
    return firstFieldError[0]
  }

  if (typeof firstFieldError === 'string') {
    return firstFieldError
  }

  return ''
}

function getProjectErrorMessage(error, fallbackMessage) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  const serverMessage = getMessageFromPayload(error.response.data)

  return serverMessage || fallbackMessage
}

function getOwnerName(owner) {
  if (!owner || typeof owner !== 'object') {
    return 'Unknown owner'
  }

  const fullName = [owner.first_name, owner.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  if (fullName) {
    return fullName
  }

  if (typeof owner.email === 'string' && owner.email.trim()) {
    return owner.email
  }

  return 'Unknown owner'
}

function getOwnerInitials(ownerName) {
  return ownerName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
}

function normalizeProject(project) {
  const ownerName = getOwnerName(project.owner)

  return {
    id: project.id,
    name: project.name || 'Untitled project',
    key: project.key || '',
    description: project.description || '',
    status: project.status || 'UNKNOWN',
    isArchived: Boolean(project.is_archived),
    ownerId: project.owner_id ?? project.owner?.id ?? '',
    ownerName,
    ownerInitials: getOwnerInitials(ownerName),
    ownerRole: project.owner?.role?.name || '',
    membersCount: project.members_count ?? 0,
    members: Array.isArray(project.members) ? project.members : [],
    completionPercentage: Number(project.completion_percentage ?? 0),
    createdAt: project.created_at || '',
    updatedAt: project.updated_at || '',
  }
}

function buildOwnerOptions(projects) {
  const seen = new Set()

  return projects.reduce((options, project) => {
    const value = project.ownerId

    if (!value || seen.has(value)) {
      return options
    }

    seen.add(value)
    options.push({
      value,
      label: project.ownerName,
    })

    return options
  }, [])
}

function buildProjectSummary(projects) {
  const activeProjects = projects.filter((project) => project.status === 'ACTIVE').length
  const archivedProjects = projects.filter((project) => project.isArchived || project.status === 'ARCHIVED').length
  const averageCompletion =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, project) => sum + project.completionPercentage, 0) / projects.length,
        )
      : 0

  return {
    activeProjects,
    archivedProjects,
    averageCompletion,
  }
}

function normalizeProjectsResponse(payload) {
  const projectCollection = Array.isArray(payload?.data) ? payload.data.map(normalizeProject) : []
  const pagination = payload?.pagination ?? {}

  return {
    projects: projectCollection,
    totalCount: pagination.total_count ?? projectCollection.length,
    limit: pagination.limit ?? projectCollection.length,
    offset: pagination.offset ?? 0,
    ownerOptions: buildOwnerOptions(projectCollection),
    summary: buildProjectSummary(projectCollection),
  }
}

function buildCreatePayload(formData) {
  return {
    name: formData.projectName.trim(),
    key: formData.projectKey.trim(),
    description: formData.description.trim(),
    owner_id: Number(formData.projectOwner),
  }
}

export async function getProjects() {
  try {
    const response = await api.get('/projects/')
    return normalizeProjectsResponse(response.data)
  } catch (error) {
    throw new Error(getProjectErrorMessage(error, 'Unable to load projects right now.'))
  }
}

export async function createProject(formData) {
  try {
    const response = await api.post('/projects/', buildCreatePayload(formData))
    return response.data
  } catch (error) {
    throw new Error(getProjectErrorMessage(error, 'Unable to create the project right now.'))
  }
}
