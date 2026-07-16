import AppShell from '../../components/layout/AppShell.jsx'
import useProject from '../../hooks/useProject.js'

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

function formatDateTime(value) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getRoleLabel(role) {
  if (!role) {
    return 'Member'
  }

  return String(role).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

function navigateToProjects() {
  window.history.pushState({}, '', '/projects')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-5 py-4">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="m-0 mt-2 text-base font-bold text-slate-900">{value}</dd>
    </div>
  )
}

export default function ProjectDetailPage({ projectId }) {
  const { errorMessage, isLoading, project } = useProject(projectId)
  const permissions = project?.permissions || {}

  return (
    <AppShell activePath="/projects">
      <section aria-labelledby="project-detail-title">
        <button
          type="button"
          onClick={navigateToProjects}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
        >
          <ArrowLeftIcon />
          Back to Projects
        </button>

        {isLoading ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-8 w-64 rounded bg-slate-100" />
            <div className="mt-4 h-4 w-full max-w-xl rounded bg-slate-100" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && project ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 id="project-detail-title" className="m-0 text-4xl font-black text-slate-900">
                  {project.name}
                </h1>
                <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-500">
                  {project.description || 'No description provided.'}
                </p>
              </div>
              <span className="self-start rounded-lg bg-[#eef0ff] px-4 py-2 text-sm font-extrabold text-[#4030e8]">
                {getRoleLabel(project.current_user_role)}
              </span>
            </div>

            <dl className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Members" value={project.total_members ?? 'N/A'} />
              <DetailItem label="Tasks" value={project.total_tasks ?? 'N/A'} />
              <DetailItem label="Status" value={project.is_active ? 'Active' : 'Inactive'} />
              <DetailItem label="Created At" value={formatDateTime(project.created_at)} />
              <DetailItem label="Updated At" value={formatDateTime(project.updated_at)} />
              <DetailItem label="Can Manage Members" value={permissions.can_manage_members ? 'Yes' : 'No'} />
            </dl>
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
