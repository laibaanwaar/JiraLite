import ActionButton from './ActionButton'
import StatusBadge from './StatusBadge'

function formatRelativeTime(value) {
  if (!value) {
    return 'N/A'
  }

  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return 'N/A'
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))

  if (deltaSeconds < 60) {
    return 'Just now'
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60)

  if (deltaMinutes < 60) {
    return `${deltaMinutes} min${deltaMinutes === 1 ? '' : 's'} ago`
  }

  const deltaHours = Math.floor(deltaMinutes / 60)

  if (deltaHours < 24) {
    return `${deltaHours} hour${deltaHours === 1 ? '' : 's'} ago`
  }

  const deltaDays = Math.floor(deltaHours / 24)

  if (deltaDays < 30) {
    return `${deltaDays} day${deltaDays === 1 ? '' : 's'} ago`
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function UserTableRow({ user, isToggling, onToggle }) {
  return (
    <tr className="transition hover:bg-slate-50/80">
      <td className="border-b border-slate-100 px-5 py-5 align-top">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-xs font-bold text-[#2142a5]">
            {user.initials || 'NA'}
          </div>
          <p className="font-semibold text-slate-900">{user.name}</p>
        </div>
      </td>
      <td className="border-b border-slate-100 px-5 py-5 align-top text-sm text-slate-500">
        {user.email}
      </td>
      <td className="border-b border-slate-100 px-5 py-5 align-top text-sm font-medium text-slate-700">
        {user.roleName}
      </td>
      <td className="border-b border-slate-100 px-5 py-5 align-top">
        <StatusBadge isActive={user.isActive} />
      </td>
      <td className="border-b border-slate-100 px-5 py-5 align-top text-sm text-slate-500">
        {formatRelativeTime(user.dateJoined || user.createdAt)}
      </td>
      <td className="border-b border-slate-100 px-5 py-5 align-top">
        <ActionButton isActive={user.isActive} isLoading={isToggling} onClick={onToggle} />
      </td>
    </tr>
  )
}

export default UserTableRow
