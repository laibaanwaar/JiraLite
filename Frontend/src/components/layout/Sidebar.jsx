import { useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import { storeAuthNotice } from '../../services/authService.js'
import { navigateTo } from '../../utils/navigation.js'

function navigate(event, href, onNavigate, options = {}) {
  event?.preventDefault()
  navigateTo(href, options)
  onNavigate?.()
}

function BrandMark() {
  return (
    <div className="relative h-7 w-7 text-blue-600" aria-hidden="true">
      <span className="absolute bottom-1 left-1 h-4 w-1.5 rounded-sm bg-current" />
      <span className="absolute bottom-1 left-3 h-5 w-1.5 rounded-sm bg-current" />
      <span className="absolute bottom-1 left-5 h-6 w-1.5 rounded-sm bg-current" />
      <span className="absolute left-0 top-2.5 h-1.5 w-3 rounded-full bg-current" />
    </div>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4.75 5.75h6.5v5.5h-6.5v-5.5Zm8 0h6.5v8h-6.5v-8Zm-8 7h6.5v6.5h-6.5v-6.5Zm8 2.5h6.5v4h-6.5v-4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 7.5h6l1.7 2H20v8.75H4V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6.5 7.5h11M6.5 12h11M6.5 16.5h7M4 7.5h.01M4 12h.01M4 16.5h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M10 6H6.5v12H10M14 8l4 4-4 4M18 12H9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function Sidebar({ activePath = '/profile', onNavigate }) {
  const { logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const roleCode = user?.role?.code || ''
  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { label: 'Projects', path: '/projects', icon: FolderIcon },
    { label: 'Tasks', path: '/tasks', icon: TasksIcon, allowedRoles: ['ADMIN'] },
  ].filter((item) => !item.allowedRoles || item.allowedRoles.includes(roleCode))

  const handleLogout = async (event) => {
    event.preventDefault()

    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      const result = await logout()
      storeAuthNotice({
        message: result.message,
        type: result.variant,
      })

      navigate(event, '/login', onNavigate, {
        replace: true,
        state: {
          authNotice: {
            message: result.message,
            type: result.variant,
          },
        },
      })
    } catch {
      storeAuthNotice({
        message: 'You have been signed out on this device, but the server could not confirm logout.',
        type: 'warning',
      })

      navigate(event, '/login', onNavigate, {
        replace: true,
        state: {
          authNotice: {
            message:
              'You have been signed out on this device, but the server could not confirm logout.',
            type: 'warning',
          },
        },
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-slate-200 bg-white px-4 py-4 md:w-[250px]">
      <div
        className="mb-8 flex items-center gap-2 px-2 text-xl font-extrabold text-slate-900"
        aria-label="JiraLite"
      >
        <BrandMark />
        Jira<span className="text-[#2d5bff]">Lite</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive =
            activePath === item.path ||
            (item.path === '/projects' && (activePath === '/projects/create' || activePath.startsWith('/projects/')))
          const itemClassName = `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
            isActive
              ? 'bg-[#eef0ff] text-[#4030e8]'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`

          return (
            <button
              key={item.label}
              type="button"
              className={`${itemClassName} cursor-pointer text-left`}
              onClick={(event) => navigate(event, item.path, onNavigate)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-8 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Log out"
          aria-busy={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-slate-600"
        >
          <LogoutIcon />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}
