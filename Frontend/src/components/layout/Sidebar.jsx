import { clearAuthSession, logoutUser } from '../../services/authService.js'

const navigationItems = [
  { label: 'Profile', path: '/profile', icon: ProfileIcon },
  { label: 'Projects', path: '/projects/create', icon: FolderIcon },
  { label: 'Tasks', path: '/tasks', icon: TasksIcon },
  { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { label: 'Activity', path: '/activity', icon: ActivityIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
  { label: 'Notifications', path: '/notifications', icon: BellIcon },
  { label: 'Help & Support', path: '/support', icon: HelpIcon },
]

function navigate(event, href, onNavigate) {
  event.preventDefault()
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
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

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 12a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm-6 7a6 6 0 0 1 12 0"
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7.5 4.5v3M16.5 4.5v3M5 9h14M5.5 6.5h13v12h-13v-12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M5 12h3l2-5 4 10 2-5h3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm0-11v2m0 11.5v2M5.9 5.9l1.4 1.4m9.4 9.4 1.4 1.4m0-12.2-1.4 1.4m-9.4 9.4-1.4 1.4M4.25 12h2m11.5 0h2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M17.5 10.5a5.5 5.5 0 0 0-11 0v3.75L5 17h14l-1.5-2.75V10.5ZM10 19h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 18h.01M9.75 9.5a2.25 2.25 0 1 1 3.7 1.73c-.9.72-1.45 1.2-1.45 2.27M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
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
  const handleLogout = (event) => {
    event.preventDefault()
    logoutUser()
      .catch(() => {
        clearAuthSession()
      })
      .finally(() => {
        navigate(event, '/login', onNavigate)
      })
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
          const isActive = activePath === item.path
          const isNavigable =
            item.path === '/profile' || item.path === '/projects/create' || item.path === '/tasks'
          const itemClassName = `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
            isActive
              ? 'bg-[#eef0ff] text-[#4030e8]'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`

          return (
            <button
              key={item.label}
              type="button"
              className={`${itemClassName} text-left ${isNavigable ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={isNavigable ? (event) => navigate(event, item.path, onNavigate) : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-8 border-t border-slate-200 pt-4">
        <a
          href="/login"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <LogoutIcon />
          Logout
        </a>
      </div>
    </aside>
  )
}
