import AppShell from '../../components/layout/AppShell.jsx'
import CreateProjectForm from '../../components/projects/CreateProjectForm.jsx'

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M19.5 12h-15m0 0 6-6m-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function navigateToProjects() {
  window.history.pushState({}, '', '/projects')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function CreateProjectPage() {
  return (
    <AppShell activePath="/projects" mainClassName="px-5 py-6 sm:px-8 md:px-10 md:py-8">
      <section aria-labelledby="create-project-title">
        <button
          type="button"
          onClick={navigateToProjects}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
        >
          <ArrowLeftIcon />
          Back
        </button>

        <h1
          id="create-project-title"
          className="mt-5 text-4xl font-black leading-tight text-slate-900"
        >
          Create New Project
        </h1>
        <p className="mt-3 text-base font-semibold text-slate-500">
          Add your project details and invite users.
        </p>

        <CreateProjectForm />
      </section>
    </AppShell>
  )
}
