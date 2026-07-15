import AppShell from '../components/AppShell'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import ProjectsOverviewCards from '../components/projects/ProjectsOverviewCards'
import ProjectsTable from '../components/projects/ProjectsTable'
import ProjectsToolbar from '../components/projects/ProjectsToolbar'
import { useProjects } from '../hooks/useProjects'

function Projects() {
  const {
    closeCreateModal,
    createError,
    formData,
    handleCreateProject,
    handleFormChange,
    isCreateModalOpen,
    isCreating,
    isLoading,
    listError,
    openCreateModal,
    ownerOptions,
    projects,
    refreshProjects,
    summary,
    totalCount,
  } = useProjects()

  return (
    <AppShell>
      <section className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="min-h-[calc(100vh-8rem)] rounded-[28px] border border-slate-200 bg-[#f8faff] px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <ProjectsToolbar onCreateProject={openCreateModal} />
            <ProjectsOverviewCards summary={summary} isLoading={isLoading} />
            <ProjectsTable
              projects={projects}
              totalCount={totalCount}
              isLoading={isLoading}
              errorMessage={listError}
              onRetry={refreshProjects}
            />
          </div>
        </div>
      </section>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        formData={formData}
        ownerOptions={ownerOptions}
        onClose={closeCreateModal}
        onChange={handleFormChange}
        onSubmit={handleCreateProject}
        isSubmitting={isCreating}
        errorMessage={createError}
      />
    </AppShell>
  )
}

export default Projects
