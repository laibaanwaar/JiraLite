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

function getUserErrorMessage(error, fallbackMessage) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  const serverMessage = getMessageFromPayload(error.response.data)

  return serverMessage || fallbackMessage
}

function getUserDisplayName(user) {
  const fullName = [user.first_name, user.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  if (fullName) {
    return fullName
  }

  return user.email || 'Unknown user'
}

function getUserInitials(user) {
  return [user.first_name, user.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: getUserDisplayName(user),
    initials: getUserInitials(user),
    email: user.email || '',
    roleName: user.role?.name || 'No role',
    roleCode: user.role?.code || '',
    isActive: Boolean(user.is_active),
    dateJoined: user.date_joined || '',
    createdAt: user.created_at || '',
  }
}

function normalizeUsersResponse(payload) {
  const userCollection = Array.isArray(payload?.data) ? payload.data.map(normalizeUser) : []
  const pagination = payload?.pagination ?? {}

  return {
    users: userCollection,
    totalCount: pagination.total_count ?? userCollection.length,
    limit: pagination.limit ?? userCollection.length,
    offset: pagination.offset ?? 0,
  }
}

function normalizeDashboardResponse(payload) {
  return {
    totalUsers: Number(payload?.data?.total_users ?? 0),
    activeNow: Number(payload?.data?.active_now ?? 0),
    openInvites: Number(payload?.data?.open_invites ?? 0),
  }
}

export async function getUsersDashboard() {
  try {
    const response = await api.get('/users/dashboard/')
    return normalizeDashboardResponse(response.data)
  } catch (error) {
    throw new Error(getUserErrorMessage(error, 'Unable to load the users dashboard right now.'))
  }
}

export async function getUsers() {
  try {
    const response = await api.get('/users/')
    return normalizeUsersResponse(response.data)
  } catch (error) {
    throw new Error(getUserErrorMessage(error, 'Unable to load users right now.'))
  }
}

export async function toggleUserActivation(userId) {
  try {
    const response = await api.patch(`/users/${userId}/deactivate/`)
    return response.data
  } catch (error) {
    throw new Error(getUserErrorMessage(error, 'Unable to update this user right now.'))
  }
}
