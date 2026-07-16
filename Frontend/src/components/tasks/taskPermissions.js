export function getProjectRole(entity) {
  return (
    entity?.current_user_role ||
    entity?.project_role ||
    entity?.membership_role ||
    entity?.role ||
    entity?.project_membership?.role ||
    ''
  )
}

export function canManageTask(task) {
  const role = getProjectRole(task).toUpperCase()
  return role === 'OWNER' || role === 'ADMIN'
}

export function canCreateTask(project) {
  const role = getProjectRole(project).toUpperCase()
  return role === 'OWNER' || role === 'ADMIN'
}

export function canUpdateAssignedTask(task, userId) {
  return Number(task?.assignee?.user_id) === Number(userId)
}
