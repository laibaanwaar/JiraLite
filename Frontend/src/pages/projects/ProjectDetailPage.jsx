import AppShell from '../../components/layout/AppShell.jsx'
import InviteMemberForm from '../../components/projects/InviteMemberForm.jsx'
import useAuth from '../../hooks/useAuth.js'
import useProject from '../../hooks/useProject.js'
import useProjectMembers from '../../hooks/useProjectMembers.js'

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

function getInvitationRoleOptions(project) {
  return (
    project?.invitation_role_options ||
    project?.available_project_roles ||
    project?.project_role_options ||
    []
  )
}

export default function ProjectDetailPage({ projectId }) {
  const { roleCode } = useAuth()
  const { errorMessage, isLoading, project } = useProject(projectId)
  const { errorMessage: membersError, isLoading: isLoadingMembers, members } = useProjectMembers(projectId)
  const permissions = project?.permissions || {}
  const canInviteMembers =
    roleCode === 'ADMIN' || permissions.can_manage_members || permissions.can_invite_users

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
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
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

            <InviteMemberForm
              canInvite={canInviteMembers}
              projectId={projectId}
              roleOptions={getInvitationRoleOptions(project)}
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="project-members-title">
              <div className="flex flex-col gap-1">
                <h2 id="project-members-title" className="m-0 text-2xl font-black text-slate-900">
                  Project Members
                </h2>
                <p className="m-0 text-sm font-semibold text-slate-500">
                  Current members for this project.
                </p>
              </div>

              {isLoadingMembers ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : null}

              {!isLoadingMembers && membersError ? (
                <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {membersError}
                </p>
              ) : null}

              {!isLoadingMembers && !membersError && members.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {members.map((member) => (
                    <article key={member.id || member.user_id || member.email} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="m-0 text-base font-black text-slate-900">
                        {[member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || 'Member'}
                      </p>
                      <p className="mb-0 mt-1 text-sm font-semibold text-slate-500">{member.email || 'No email provided'}</p>
                      <p className="mb-0 mt-3 text-xs font-black uppercase tracking-wide text-[#4030e8]">
                        {getRoleLabel(member.role || member.project_role || member.membership_role)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}

              {!isLoadingMembers && !membersError && members.length === 0 ? (
                <p className="mt-5 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-500">
                  No project members were returned by the API yet.
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
