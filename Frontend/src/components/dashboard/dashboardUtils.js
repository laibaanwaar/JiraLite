export function getSafeNumber(value) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : 0
}

export function formatDisplayDate(value) {
  if (!value) {
    return 'No date'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No date'
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isToday(value) {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function formatRoleLabel(role) {
  if (!role) {
    return 'Member'
  }

  if (role === 'OWNER') {
    return 'Owner'
  }

  if (role === 'ADMIN') {
    return 'Admin'
  }

  return role
}

export function getStatusColor(status) {
  if (status === 'TO_DO') {
    return '#2563eb'
  }

  if (status === 'IN_PROGRESS') {
    return '#ef4444'
  }

  if (status === 'IN_REVIEW') {
    return '#f59e0b'
  }

  if (status === 'DONE') {
    return '#22c55e'
  }

  return '#94a3b8'
}

export function getPriorityColor(priority) {
  if (priority === 'LOW') {
    return '#22c55e'
  }

  if (priority === 'MEDIUM') {
    return '#f59e0b'
  }

  if (priority === 'HIGH') {
    return '#ef4444'
  }

  if (priority === 'URGENT') {
    return '#7c3aed'
  }

  return '#94a3b8'
}

export function calculatePercentage(count, total) {
  const safeCount = getSafeNumber(count)
  const safeTotal = getSafeNumber(total)

  if (safeTotal <= 0) {
    return 0
  }

  return Math.round((safeCount / safeTotal) * 100)
}

export function getAssigneeName(assignee) {
  return [assignee?.first_name, assignee?.last_name].filter(Boolean).join(' ') || 'Unassigned'
}
