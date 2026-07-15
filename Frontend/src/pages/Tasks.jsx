import AppShell from '../components/AppShell'
import CreateTaskModal from '../components/tasks/CreateTaskModal'
import TaskManagementToolbar from '../components/tasks/TaskManagementToolbar'
import TaskTable from '../components/tasks/TaskTable'
import { useTasks } from '../hooks/useTasks'

function Tasks() {
  const {
    assigneeOptions,
    assigneeError,
    closeCreateModal,
    createError,
    formData,
    handleCreateTask,
    handleFormChange,
    isCreateModalOpen,
    isCreating,
    isLoading,
    isProjectsLoading,
    isUsersLoading,
    listError,
    openCreateModal,
    projectOptions,
    projectFilterError,
    projectFilterOptions,
    refreshTasks,
    selectedProjectId,
    handleProjectSelection,
    tasks,
    totalCount,
  } = useTasks()

  return (
    <AppShell>
      <section className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="min-h-[calc(100vh-8rem)] rounded-[28px] border border-slate-200 bg-[#f8faff] px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <TaskManagementToolbar
              onCreateTask={openCreateModal}
              projectFilterOptions={projectFilterOptions}
              projectFilterError={projectFilterError}
              selectedProjectId={selectedProjectId}
              onProjectSelection={handleProjectSelection}
              isProjectsLoading={isProjectsLoading}
            />
            <TaskTable
              tasks={tasks}
              totalCount={totalCount}
              isLoading={isLoading}
              errorMessage={listError}
              onRetry={refreshTasks}
            />
          </div>
        </div>
      </section>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        formData={formData}
        projectOptions={projectOptions}
        assigneeOptions={assigneeOptions}
        assigneeError={assigneeError}
        onClose={closeCreateModal}
        onChange={handleFormChange}
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
        isUsersLoading={isUsersLoading}
        errorMessage={createError}
      />
    </AppShell>
  )
}

export default Tasks
