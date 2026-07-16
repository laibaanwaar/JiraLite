import axios from 'axios'
import { getAccessToken } from './authService.js'

const API_BASE = 'http://127.0.0.1:8000'

function authHeaders(accessToken = getAccessToken()) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {}
}

export async function createProject(projectPayload, accessToken = getAccessToken()) {
  const response = await axios.post(`${API_BASE}/api/projects/`, projectPayload, {
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export async function acceptProjectInvitation(payload, accessToken = getAccessToken()) {
  const response = await axios.post(`${API_BASE}/api/project-invitations/accept/`, payload, {
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
  })
  return response.data
}
