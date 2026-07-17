export function getUserRoleCode(user) {
  const roleCode =
    user?.role?.code ||
    user?.user?.role?.code ||
    user?.data?.role?.code ||
    user?.role_code ||
    user?.role

  return typeof roleCode === 'string' ? roleCode.toUpperCase() : ''
}

export function getDashboardPathForRole(roleCode) {
  return roleCode ? '/dashboard' : '/profile'
}

export function isEmailMatch(left, right) {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

export function getUserDisplayName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.email || 'User'
}
