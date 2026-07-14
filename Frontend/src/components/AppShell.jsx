import Sidebar from './Sidebar'
import { AUTH_STORAGE_KEYS } from '../services/authService'

function getStoredUser() {
  const storages = [localStorage, sessionStorage]

  for (const storage of storages) {
    const serializedUser = storage.getItem(AUTH_STORAGE_KEYS.user)

    if (!serializedUser) {
      continue
    }

    try {
      const parsedUser = JSON.parse(serializedUser)

      if (parsedUser && typeof parsedUser === 'object') {
        return parsedUser
      }
    } catch {
      return null
    }
  }

  return null
}

function getUserDisplayName(user) {
  if (!user) {
    return ''
  }

  const fullName = [user.first_name, user.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  if (fullName) {
    return fullName
  }

  if (typeof user.name === 'string' && user.name.trim()) {
    return user.name
  }

  if (typeof user.email === 'string' && user.email.trim()) {
    return user.email
  }

  return ''
}

function getUserRoleLabel(user) {
  if (typeof user?.role === 'string' && user.role.trim()) {
    return user.role
  }

  if (typeof user?.role_name === 'string' && user.role_name.trim()) {
    return user.role_name
  }

  return ''
}

function AppShell({ children }) {
  const user = getStoredUser()
  const displayName = getUserDisplayName(user)
  const userRole = getUserRoleLabel(user)

  return (
    <div className="min-h-screen bg-[#eef3ff] text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-[#f8faff]">
            <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-xl">
                <SearchIcon />
                <input
                  type="search"
                  placeholder="Search"
                  className="w-full rounded-full border border-slate-300 bg-[#eef2ff] py-2 pl-10 pr-4 text-sm text-slate-600 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-between gap-4 lg:justify-end">
                <div className="flex items-center gap-4 text-slate-500">
                  <IconButton label="Notifications">
                    <BellIcon />
                  </IconButton>
                  <IconButton label="Help">
                    <HelpIcon />
                  </IconButton>
                  <IconButton label="Settings">
                    <CogIcon />
                  </IconButton>
                </div>

                <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                <div className="text-right">
                  {displayName ? (
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  ) : null}
                  {userRole ? <p className="text-xs text-slate-500">{userRole}</p> : null}
                </div>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  )
}

function IconButton({ label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-full p-1.5 transition hover:bg-white hover:text-slate-700"
    >
      {children}
    </button>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4.75a4 4 0 0 0-4 4v1.67c0 .53-.21 1.04-.59 1.41L6.5 12.75v1h11v-1l-.91-.92a2 2 0 0 1-.59-1.41V8.75a4 4 0 0 0-4-4Z" />
      <path d="M10 17.25a2 2 0 0 0 4 0" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.75 9.25a2.75 2.75 0 1 1 4.53 2.1c-.84.7-1.28 1.18-1.28 2.15" />
      <path d="M12 16.75h.01" strokeLinecap="round" />
    </svg>
  )
}

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M19 12a7 7 0 0 0-.07-.98l1.57-1.23-1.5-2.6-1.91.53a7 7 0 0 0-1.7-.99L15 4h-3l-.39 1.5a7 7 0 0 0-1.7.99L8 5.96l-1.5 2.6 1.57 1.23a7 7 0 0 0 0 1.96L6.5 13.98l1.5 2.6 1.91-.53c.52.4 1.09.73 1.7.99L12 20h3l.39-1.5c.61-.26 1.18-.59 1.7-.99l1.91.53 1.5-2.6-1.57-1.23c.05-.32.07-.65.07-.98Z" />
    </svg>
  )
}

export default AppShell
