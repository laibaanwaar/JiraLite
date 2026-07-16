import { useState } from 'react'
import Sidebar from '../../components/layout/Sidebar.jsx'
import CreateProjectForm from '../../components/projects/CreateProjectForm.jsx'

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

export default function CreateProjectPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1180px] border-x border-slate-200 bg-white">
        <div className="hidden md:block">
          <Sidebar activePath="/projects/create" />
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
              <Sidebar
                activePath="/projects/create"
                onNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 md:px-14 md:py-10">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] md:hidden"
          >
            <MenuIcon />
            Menu
          </button>

          <section aria-labelledby="create-project-title">
            <h1
              id="create-project-title"
              className="m-0 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl"
            >
              Create New Project
            </h1>
            <p className="mt-3 text-base font-semibold text-slate-500 md:text-lg">
              Add your project details and invite users.
            </p>

            <CreateProjectForm />
          </section>
        </main>
      </div>
    </div>
  )
}
