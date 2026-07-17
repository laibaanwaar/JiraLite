import axios from 'axios'
import { API_BASE } from './apiConfig.js'
import { getAccessToken } from './authService.js'

function authHeaders(accessToken = getAccessToken()) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {}
}

function normalizeCollectionError(error, fallbackMessage) {
  const responseData = error?.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message
  }

  if (typeof responseData?.detail === 'string' && responseData.detail.trim()) {
    return responseData.detail
  }

  const nestedError = responseData && typeof responseData === 'object'
    ? Object.values(responseData).flat().find((value) => typeof value === 'string' && value.trim())
    : ''

  return nestedError || fallbackMessage
}

export function normalizeInvitationError(error, fallbackMessage = 'Unable to process the invitation right now.') {
  const status = error?.response?.status
  const message = normalizeCollectionError(error, fallbackMessage)
  const normalizedMessage = message.toLowerCase()
  const responseData = error?.response?.data

  return {
    fieldErrors: responseData && typeof responseData === 'object'
      ? Object.fromEntries(
          Object.entries(responseData)
            .filter(([, value]) => Array.isArray(value) && value.length)
            .map(([key, value]) => [key, value[0]]),
        )
      : {},
    isAlreadyMember: normalizedMessage.includes('already a member') || normalizedMessage.includes('already member'),
    isDuplicate: normalizedMessage.includes('already invited') || normalizedMessage.includes('duplicate'),
    message,
    status,
  }
}

export async function getInvitation(token, options = {}) {
  const response = await axios.get(`${API_BASE}/api/invitations/${encodeURIComponent(token)}/`, {
    signal: options.signal,
    timeout: options.timeout || 10000,
  })
  return response.data?.data || response.data
}

function buildInvitationAuthHeaders({ accessToken = getAccessToken(), includeAuth = false } = {}) {
  return includeAuth ? authHeaders(accessToken) : {}
}

export async function acceptInvitation(token, payload = {}, options = {}) {
  const response = await axios.post(
    `${API_BASE}/api/invitations/${encodeURIComponent(token)}/accept/`,
    payload,
    {
      headers: {
        ...buildInvitationAuthHeaders(options),
        'Content-Type': 'application/json',
      },
    },
  )

  return response.data
}

export async function rejectInvitation(token, options = {}) {
  const response = await axios.post(
    `${API_BASE}/api/invitations/${encodeURIComponent(token)}/reject/`,
    {},
    {
      headers: {
        ...buildInvitationAuthHeaders(options),
        'Content-Type': 'application/json',
      },
    },
  )

  return response.data
}

export async function sendProjectInvitation(projectId, payload, accessToken = getAccessToken()) {
  const response = await axios.post(
    `${API_BASE}/api/projects/${projectId}/invitations/`,
    payload,
    {
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': 'application/json',
      },
    },
  )

  return response.data
}
