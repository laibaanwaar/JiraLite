import { useCallback, useEffect, useState } from 'react'

import { getUsers, getUsersDashboard, toggleUserActivation } from '../services/userService'

const INITIAL_SUMMARY = {
  totalUsers: 0,
  activeNow: 0,
  openInvites: 0,
}

export function useUsers() {
  const [summary, setSummary] = useState(INITIAL_SUMMARY)
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [usersError, setUsersError] = useState('')
  const [actionError, setActionError] = useState('')
  const [togglingUserId, setTogglingUserId] = useState(null)

  const loadDashboard = useCallback(async () => {
    setIsLoadingSummary(true)
    setDashboardError('')

    try {
      const response = await getUsersDashboard()
      setSummary(response)
    } catch (error) {
      setDashboardError(error.message)
    } finally {
      setIsLoadingSummary(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    setUsersError('')

    try {
      const response = await getUsers()
      setUsers(response.users)
      setTotalCount(response.totalCount)
    } catch (error) {
      setUsersError(error.message)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
    loadUsers()
  }, [loadDashboard, loadUsers])

  const handleToggleUserActivation = async (userId) => {
    setActionError('')
    setTogglingUserId(userId)

    try {
      await toggleUserActivation(userId)
      await loadUsers()
      await loadDashboard()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setTogglingUserId(null)
    }
  }

  return {
    actionError,
    dashboardError,
    handleToggleUserActivation,
    isLoadingSummary,
    isLoadingUsers,
    refreshDashboard: loadDashboard,
    refreshUsers: loadUsers,
    summary,
    togglingUserId,
    totalCount,
    users,
    usersError,
  }
}
