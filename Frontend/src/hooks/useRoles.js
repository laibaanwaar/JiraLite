import { useDeferredValue, useEffect, useState } from 'react'

import { createRole, getRoles } from '../services/roleService'

const INITIAL_SUMMARY = {
  totalRoles: 0,
  activeRoles: 0,
  inactiveRoles: 0,
}

function buildSummary(roles) {
  const activeRoles = roles.filter((role) => role.isActive).length

  return {
    totalRoles: roles.length,
    activeRoles,
    inactiveRoles: roles.length - activeRoles,
  }
}

export function useRoles() {
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)

  useEffect(() => {
    let isMounted = true

    const loadRoles = async () => {
      setIsLoading(true)

      try {
        const response = await getRoles()

        if (!isMounted) {
          return
        }

        setRoles(response.roles)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRoles()

    return () => {
      isMounted = false
    }
  }, [])

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase()
  const filteredRoles = normalizedQuery
    ? roles.filter((role) => {
        const name = role.name?.toLowerCase() ?? ''
        const code = role.code?.toLowerCase() ?? ''

        return name.includes(normalizedQuery) || code.includes(normalizedQuery)
      })
    : roles

  const handleCreateRole = async (payload) => {
    setIsCreatingRole(true)

    try {
      await createRole(payload)
    } finally {
      setIsCreatingRole(false)
    }
  }

  return {
    filteredRoles,
    isCreatingRole,
    isLoading,
    onCreateRole: handleCreateRole,
    searchQuery,
    setSearchQuery,
    summary: isLoading ? INITIAL_SUMMARY : buildSummary(roles),
    totalCount: filteredRoles.length,
  }
}
