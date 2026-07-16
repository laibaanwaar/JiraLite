import { getTaskStatusLabel } from './taskMeta.js'

const statusClasses = {
  TO_DO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-700',
}

export default function TaskStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${statusClasses[status] || 'bg-slate-100 text-slate-700'}`}>
      {getTaskStatusLabel(status)}
    </span>
  )
}
