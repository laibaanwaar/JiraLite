import useAuth from '../../hooks/useAuth.js'
import { getUserDisplayName } from '../../utils/auth.js'
import { navigateTo } from '../../utils/navigation.js'

function getProfileImageUrl(user) {
  return (
    user?.profile_image ||
    user?.avatar ||
    user?.profile?.profile_image ||
    user?.data?.profile?.profile_image ||
    ''
  )
}

function getUserInitials(user) {
  const firstName = String(user?.first_name || user?.user?.first_name || '').trim()
  const lastName = String(user?.last_name || user?.user?.last_name || '').trim()
  const email = String(user?.email || user?.user?.email || '').trim()
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  if (initials) {
    return initials
  }

  return email.slice(0, 2).toUpperCase() || 'JL'
}

export default function ProfileAvatar({
  className = '',
  interactive = true,
  isLoading = false,
  size = 'md',
  user: providedUser,
}) {
  const { isRestoring, user: authUser } = useAuth()
  const user = providedUser || authUser
  const imageUrl = getProfileImageUrl(user)
  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)
  const isBusy = isLoading || isRestoring
  const sizeClassName = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-32 w-32 text-4xl',
  }[size] || 'h-11 w-11 text-sm'
  const avatarClassName = `${sizeClassName} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-[#243b6b] via-[#5d6fa3] to-[#c98152] font-extrabold text-white shadow-sm ${className}`
  const content = imageUrl && !isBusy ? (
    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <span aria-hidden={isBusy}>{isBusy ? '' : initials}</span>
  )

  if (!interactive) {
    return (
      <div className={avatarClassName} aria-label={`${displayName} profile avatar`} role="img">
        {isBusy ? <span className="h-5 w-5 animate-pulse rounded-full bg-white/40" aria-hidden="true" /> : content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => navigateTo('/profile')}
      aria-label={`Open ${displayName} profile`}
      aria-busy={isBusy}
      className={`${avatarClassName} cursor-pointer transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] active:scale-100`}
    >
      {isBusy ? <span className="h-5 w-5 animate-pulse rounded-full bg-white/40" aria-hidden="true" /> : content}
    </button>
  )
}
