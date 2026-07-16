export const TASK_STATUS_OPTIONS = [
  { value: 'TO_DO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
]

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

export function getTaskStatusLabel(value) {
  return TASK_STATUS_OPTIONS.find((option) => option.value === value)?.label || value || 'Unknown'
}

export function getTaskPriorityLabel(value) {
  return TASK_PRIORITY_OPTIONS.find((option) => option.value === value)?.label || value || 'Unknown'
}
