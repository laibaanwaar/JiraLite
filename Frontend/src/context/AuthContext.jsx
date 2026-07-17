import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearAuthSession,
  getAccessToken,
  getCurrentUser,
  getStoredUser,
  loginUser,
  logoutUser,
  storeAuthSession,
  updateStoredUser,
} from '../services/authService.js'
import { getDashboardPathForRole, getUserRoleCode } from '../utils/auth.js'

const AuthContext = createContext(null)

function extractSessionFromResponse(data) {
  return {
    accessToken: data?.data?.access || data?.access || data?.token || '',
    refreshToken: data?.data?.refresh || data?.refresh || '',
    user: data?.data?.user || data?.user || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isRestoring, setIsRestoring] = useState(() => Boolean(getAccessToken()))

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser)
    updateStoredUser(nextUser)
  }, [])

  const restoreSession = useCallback(async () => {
    const accessToken = getAccessToken()

    if (!accessToken) {
      setIsRestoring(false)
      setUser(null)
      return null
    }

    setIsRestoring(true)

    try {
      const nextUser = await getCurrentUser(accessToken)
      applyUser(nextUser)
      return nextUser
    } catch (error) {
      if (error?.response?.status === 401) {
        clearAuthSession()
        setUser(null)
      }

      return null
    } finally {
      setIsRestoring(false)
    }
  }, [applyUser])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  const login = useCallback(
    async ({ email, password, rememberMe = false }) => {
      const data = await loginUser({
        email,
        password,
      })
      const session = extractSessionFromResponse(data)

      storeAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        rememberMe,
      })

      let nextUser = session.user

      try {
        nextUser = await getCurrentUser(session.accessToken)
      } catch (error) {
        if (error?.response?.status === 401) {
          clearAuthSession()
          setUser(null)
          throw error
        }
      }

      applyUser(nextUser)
      return {
        user: nextUser,
        roleCode: getUserRoleCode(nextUser),
      }
    },
    [applyUser],
  )

  const applyAuthSession = useCallback(
    (data, { rememberMe = false } = {}) => {
      const session = extractSessionFromResponse(data)

      storeAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        rememberMe,
      })
      applyUser(session.user)

      return {
        user: session.user,
        roleCode: getUserRoleCode(session.user),
      }
    },
    [applyUser],
  )

  const updateUser = useCallback(
    (nextUser) => {
      applyUser(nextUser)
      return nextUser
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    const result = await logoutUser()
    clearAuthSession()
    setUser(null)
    return result
  }, [])

  const value = useMemo(() => {
    const roleCode = getUserRoleCode(user)
    const dashboardScope = roleCode === 'OWNER' || roleCode === 'ADMIN' ? 'managed' : 'member'

    return {
      dashboardPath: getDashboardPathForRole(roleCode),
      dashboardScope,
      permissions: user?.permissions || {},
      applyAuthSession,
      isAuthenticated: Boolean(getAccessToken() && user),
      isRestoring,
      login,
      logout,
      refreshUser: restoreSession,
      roleCode,
      updateUser,
      user,
    }
  }, [applyAuthSession, isRestoring, login, logout, restoreSession, updateUser, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
