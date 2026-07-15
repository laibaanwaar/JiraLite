import axios from 'axios'

import api from './api'

const DEFAULT_TASK_ERROR_MESSAGE = 'Unable to process tasks right now. Please try again.'

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

function getTaskErrorMessage(error, fallbackMessage) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  const serverMessage = getMessageFromPayload(error.response.data)

  return serverMessage || fallbackMessage
}

function getCollectionFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.results)) {
    return payload.results
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

function getTaskIdentifier(task) {
  return task?.task_id || task?.task_code || task?.code || task?.id || 'N/A'
}

function getEntityLabel(entity, fallback = 'Unassigned') {
  if (!entity) {
    return fallback
  }

  if (typeof entity === 'string' && entity.trim()) {
    return entity
  }

  const name = [entity.first_name, entity.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  if (name) {
    return name
  }

  if (typeof entity.name === 'string' && entity.name.trim()) {
    return entity.name
  }

  if (typeof entity.title === 'string' && entity.title.trim()) {
    return entity.title
  }

  if (typeof entity.email === 'string' && entity.email.trim()) {
    return entity.email
  }

  if (typeof entity.username === 'string' && entity.username.trim()) {
    return entity.username
  }

  return fallback
}

function getEntityValue(entity) {
  if (!entity || typeof entity !== 'object') {
    return entity ?? ''
  }

  return entity.id ?? entity.pk ?? entity.value ?? getEntityLabel(entity, '')
}

function normalizeTask(task) {
  const project =
    task?.project_details || task?.project_data || task?.project || task?.project_name || null
  const assignee =
    task?.assigned_to_details ||
    task?.assigned_user ||
    task?.assignee_details ||
    task?.assigned_to ||
    task?.assignee ||
    null

  return {
    id: task?.id ?? task?.pk ?? getTaskIdentifier(task),
    identifier: getTaskIdentifier(task),
    title: task?.title || task?.name || 'Untitled task',
    projectLabel: getEntityLabel(project, 'No project'),
    projectValue: getEntityValue(project),
    assigneeLabel: getEntityLabel(assignee),
    assigneeValue: getEntityValue(assignee),
    priority: task?.priority || 'N/A',
    status: task?.status || 'N/A',
    dueDate: task?.due_date || task?.dueDate || task?.deadline || '',
    description: task?.description || '',
    raw: task,
  }
}

function buildTaskOptions(tasks, valueKey, labelKey) {
  const seen = new Set()

  return tasks.reduce((options, task) => {
    const value = task[valueKey]
    const label = task[labelKey]
    const serializedValue = String(value ?? label ?? '')

    if (!serializedValue || !label || seen.has(serializedValue)) {
      return options
    }

    seen.add(serializedValue)
    options.push({ value, label })

    return options
  }, [])
}

function normalizeTaskCollection(payload) {
  const collection = getCollectionFromPayload(payload).map(normalizeTask)

  return {
    tasks: collection,
    count:
      payload?.count ??
      payload?.total ??
      payload?.total_count ??
      getCollectionFromPayload(payload).length,
    projectOptions: buildTaskOptions(collection, 'projectValue', 'projectLabel'),
    assigneeOptions: buildTaskOptions(collection, 'assigneeValue', 'assigneeLabel'),
  }
}

function buildCreatePayload(formData) {
  return {
    title: formData.title.trim(),
    project_id: Number(formData.project),
    assigned_to_id: Number(formData.assignedTo),
    priority: formData.priority,
    status: formData.status,
    due_date: formData.dueDate,
    description: formData.description.trim(),
  }
}

export async function getTasks() {
  try {
    const response = await api.get('/tasks/')
    return normalizeTaskCollection(response.data)
  } catch (error) {
    throw new Error(getTaskErrorMessage(error, 'Unable to load tasks right now.'))
  }
}

export async function createTask(formData) {
  try {
    const response = await api.post('/tasks/', buildCreatePayload(formData))
    return response.data
  } catch (error) {
    throw new Error(getTaskErrorMessage(error, DEFAULT_TASK_ERROR_MESSAGE))
  }
}
