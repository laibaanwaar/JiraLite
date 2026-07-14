import axios from 'axios'

const AUTH_STORAGE_KEYS = {
  accessToken: 'jiraLite.accessToken',
}

function getStoredAccessToken() {
  const storages = [localStorage, sessionStorage]

  for (const storage of storages) {
    const token = storage.getItem(AUTH_STORAGE_KEYS.accessToken)

    if (typeof token === 'string' && token.trim()) {
      return token
    }
  }

  return null
}

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default api
