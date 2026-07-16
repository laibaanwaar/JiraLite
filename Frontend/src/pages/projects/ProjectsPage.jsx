import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell.jsx'
import ProjectEmptyState from '../../components/projects/ProjectEmptyState.jsx'
import ProjectFilters from '../../components/projects/ProjectFilters.jsx'
import ProjectListSkeleton from '../../components/projects/ProjectListSkeleton.jsx'
import ProjectTable from '../../components/projects/ProjectTable.jsx'
import useProjects from '../../hooks/useProjects.js'
import { deleteProject, normalizeProjectError } from '../../services/projectService.js'

const PAGE_SIZE = 5

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function navigateToCreateProject() {
  window.history.pushState({}, '', '/projects/create')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function ProjectsPage() {
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [notice] = useState(window.history.state?.projectsNotice || '')
  const { errorMessage, isLoading, projects, refreshProjects } = useProjects({ role, search })
  const [page, setPage] = useState(1)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingProjectId, setDeletingProjectId] = useState(null)

  useEffect(() => {
    if (!window.history.state?.projectsNotice) {
      return
    }

    window.history.replaceState({}, '', '/projects')
  }, [])

  useEffect(() => {
    setPage(1)
  }, [role, search])

  const hasNoFilters = !role && !search.trim()
  const showEmptyState = !isLoading && !errorMessage && projects.length === 0 && hasNoFilters
  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleProjects = projects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleDeleteProject = (project) => {
    if (!project?.id || deletingProjectId) {
      return
    }

    setDeletingProjectId(project.id)
    setDeleteMessage('')
    setDeleteError('')

    deleteProject(project.id)
      .then((response) => {
        setDeleteMessage(response?.message || 'Project deleted successfully.')
        refreshProjects()
      })
      .catch((error) => {
        const normalized = normalizeProjectError(error)

        if (normalized.shouldRedirectToLogin) {
          window.history.replaceState(
            {
              authNotice: {
                message: normalized.message,
                type: 'warning',
              },
            },
            '',
            '/login',
          )
          window.dispatchEvent(new PopStateEvent('popstate'))
          return
        }

        setDeleteError(normalized.message || 'Unable to delete project right now.')
      })
      .finally(() => {
        setDeletingProjectId(null)
      })
  }

  return (
    <AppShell activePath="/projects">
      <section aria-labelledby="projects-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 id="projects-title" className="m-0 text-4xl font-black text-slate-900">
            Projects
          </h1>
          <button
            type="button"
            onClick={navigateToCreateProject}
            aria-label="Create new project"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#4b36f4] px-6 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(75,54,244,0.18)] transition hover:bg-[#3827d9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30"
          >
            <PlusIcon />
            New Project
          </button>
        </div>

        {notice ? (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
            {notice}
          </p>
        ) : null}

        {deleteMessage ? (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
            {deleteMessage}
          </p>
        ) : null}

        {deleteError ? (
          <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            {deleteError}
          </p>
        ) : null}

        <ProjectFilters role={role} search={search} onRoleChange={setRole} onSearchChange={setSearch} />

        {errorMessage ? (
          <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? <ProjectListSkeleton /> : null}

        {showEmptyState ? <ProjectEmptyState onCreateProject={navigateToCreateProject} /> : null}

        {!isLoading && !errorMessage && projects.length > 0 ? (
          <ProjectTable
            currentPage={safePage}
            deletingProjectId={deletingProjectId}
            onDeleteProject={handleDeleteProject}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            projects={visibleProjects}
            totalCount={projects.length}
          />
        ) : null}

        {!isLoading && !errorMessage && projects.length === 0 && !hasNoFilters ? (
          <p className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-500">
            No projects match your filters.
          </p>
        ) : null}
      </section>
    </AppShell>
  )
}
