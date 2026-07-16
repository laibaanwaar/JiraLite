import { getTaskPriorityLabel } from './taskMeta.js'

const priorityClasses = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-violet-100 text-violet-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-rose-100 text-rose-700',
}

export default function TaskPriorityBadge({ priority }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${priorityClasses[priority] || 'bg-slate-100 text-slate-700'}`}>
      {getTaskPriorityLabel(priority)}
    </span>
  )
}
