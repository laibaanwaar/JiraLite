import { useState } from 'react'
import ProfileAvatar from '../profile/ProfileAvatar.jsx'
import Sidebar from './Sidebar.jsx'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export default function AppShell({
  activePath,
  children,
  frameClassName = '',
  mainClassName = '',
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-slate-900">
      <div
        className={`mx-auto flex min-h-screen max-w-[1280px] overflow-hidden border-x border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] ${frameClassName}`}
      >
        <div className="hidden md:block">
          <Sidebar activePath={activePath} />
        </div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            />
            <div className="absolute left-0 top-0 h-full w-[260px] bg-white shadow-2xl">
              <Sidebar activePath={activePath} onNavigate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 bg-linear-to-b from-[#fcfdff] via-white to-[#f8fbff]">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur sm:px-8 md:justify-end md:px-10">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] md:hidden"
            >
              <MenuIcon />
              Menu
            </button>

            <ProfileAvatar />
          </header>

          <div className={`px-5 py-6 sm:px-8 md:px-10 md:py-8 ${mainClassName}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
