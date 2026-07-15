const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { label: 'Projects', href: '/projects', icon: ProjectsIcon },
  { label: 'Tasks', href: '/tasks', icon: TasksIcon },
  { label: 'Users', href: '/users', icon: UsersIcon },
  { label: 'Roles', href: '/roles', icon: RolesIcon },
]

function navigateTo(pathname) {
  if (window.location.pathname === pathname) {
    return
  }

  window.history.pushState({}, '', pathname)
  window.dispatchEvent(new Event('app:navigate'))
}

function Sidebar() {
  const currentPath = window.location.pathname

  return (
    <aside className="flex w-full max-w-60 flex-col border-r border-slate-200 bg-[#f7f9ff]">
      <div className="border-b border-slate-200 px-6 py-6">
        <h1 className="text-2xl font-black tracking-tight text-blue-700">JiraLite</h1>
      </div>

      <nav className="flex-1 px-4 py-6" aria-label="Sidebar">
        <ul className="space-y-2">
          {navigationItems.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => navigateTo(href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  currentPath === href
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-200 px-4 py-5">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          <SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-slate-500"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4.75 5.75h6.5v5.5h-6.5zM12.75 5.75h6.5v3.5h-6.5zM12.75 10.75h6.5v7.5h-6.5zM4.75 13.25h6.5v5h-6.5z" />
    </svg>
  )
}

function ProjectsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-slate-500"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 4h10l2 3v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M9 10h6M9 14h4" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-slate-500"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6.5h.01M4.5 12.5h.01M4.5 18.5h.01" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-slate-500"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="11" r="3" />
      <path d="M19 19a3 3 0 0 0-2-2.83M17 8.5a2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}

function RolesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-slate-500"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16" cy="15" r="2.5" />
      <path d="M10.5 10.5l3 3" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-slate-500"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25 3.25 3.25 0 1 0 12 8.75z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.7Z" />
    </svg>
  )
}

export default Sidebar
