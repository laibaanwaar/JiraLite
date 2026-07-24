import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import CreateProjectModal from "../components/projects/CreateProjectModal";
import DeleteProjectModal from "../components/projects/DeleteProjectModal";
import EditProjectModal from "../components/projects/EditProjectModal";
import ProjectCard from "../components/projects/ProjectCard";

import {
  createProject,
  deleteProject,
  getProjectMembers,
  getProjects,
  getProjectTasks,
  updateProject,
} from "../services/projectService";

const Projects = () => {
  const [projects, setProjects] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("All");

  const [
    isCreateModalOpen,
    setIsCreateModalOpen,
  ] = useState(false);

  const [
    isEditModalOpen,
    setIsEditModalOpen,
  ] = useState(false);

  const [
    isDeleteModalOpen,
    setIsDeleteModalOpen,
  ] = useState(false);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  // ==========================================
  // CHECK WHETHER PROJECT SHOULD BE VISIBLE
  // ==========================================
  //
  // Backend uses soft delete:
  //
  // ACTIVE / COMPLETED
  //        ↓ DELETE
  // ARCHIVED
  //
  // Archived projects remain in the database
  // and may still be returned by GET /projects/.
  //
  // The frontend hides them completely.
  // ==========================================

  const isVisibleProject = (
    project,
  ) => {
    return (
      project?.status !==
      "ARCHIVED"
    );
  };

  // ==========================================
  // ENRICH PROJECT WITH MEMBERS + TASKS
  // ==========================================

  const enrichProject = async (
    project,
  ) => {
    /*
      Safety guard.

      Archived projects should never
      reach this function because they
      are filtered in loadProjects().

      This also prevents accidental
      GET /projects/{id}/tasks/
      requests for archived projects.
    */

    if (!isVisibleProject(project)) {
      return {
        ...project,

        members: [],

        members_count: 0,

        total_tasks: 0,

        completed_tasks: 0,

        progress: 0,
      };
    }

    const [
      membersResult,
      tasksResult,
    ] = await Promise.allSettled([
      getProjectMembers(project.id),
      getProjectTasks(project.id),
    ]);

    // Members API response:
    //
    // {
    //   data: {
    //     members: [...]
    //   }
    // }

    const members =
      membersResult.status ===
      "fulfilled"
        ? membersResult.value?.data
            ?.members || []
        : [];

    // Tasks API response:
    //
    // {
    //   data: {
    //     tasks: [...]
    //   }
    // }

    const tasks =
      tasksResult.status ===
      "fulfilled"
        ? tasksResult.value?.data
            ?.tasks || []
        : [];

    const completedTasks =
      tasks.filter(
        (task) =>
          task.status === "DONE",
      ).length;

    const progress =
      tasks.length === 0
        ? 0
        : Math.round(
            (completedTasks /
              tasks.length) *
              100,
          );

    return {
      ...project,

      members,

      members_count:
        members.length,

      total_tasks:
        tasks.length,

      completed_tasks:
        completedTasks,

      progress,
    };
  };

  // ==========================================
  // LOAD PROJECTS
  // ==========================================

  const loadProjects = async () => {
    try {
      setIsLoading(true);

      const response =
        await getProjects();

      const allProjects =
        Array.isArray(
          response?.data,
        )
          ? response.data
          : [];

      /*
        IMPORTANT:

        Backend soft-deletes projects
        by setting:

        status = "ARCHIVED"

        GET /api/projects/ may still
        return those archived projects.

        Remove them BEFORE fetching
        members and tasks.

        This prevents:

        1. Deleted cards appearing again
           after page reload.

        2. Archived project task requests
           returning 403 Forbidden.
      */

      const baseProjects =
        allProjects.filter(
          (project) =>
            isVisibleProject(
              project,
            ),
        );

      /*
        GET /api/projects/
        currently does not return:

        - members
        - members_count
        - total_tasks
        - progress

        Therefore fetch members/tasks
        only for visible projects.
      */

      const enrichedProjects =
        await Promise.all(
          baseProjects.map(
            (project) =>
              enrichProject(
                project,
              ),
          ),
        );

      setProjects(
        enrichedProjects,
      );
    } catch (error) {
      toast.error(
        error?.message ||
          "Unable to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // ==========================================
  // CREATE PROJECT
  // ==========================================

  const handleCreateProject =
    async (projectData) => {
      try {
        setIsCreating(true);

        const response =
          await createProject(
            projectData,
          );

        const createdProject =
          response?.data;

        if (!createdProject?.id) {
          throw new Error(
            "Project was created but project data was not returned.",
          );
        }

        /*
          Archived projects should never
          normally be created.

          Safety check prevents an archived
          project from appearing in UI.
        */

        if (
          !isVisibleProject(
            createdProject,
          )
        ) {
          return true;
        }

        /*
          Fetch actual member/task data
          for the newly created project.
        */

        const enrichedProject =
          await enrichProject(
            createdProject,
          );

        /*
          New project immediately
          appears without refresh.
        */

        setProjects(
          (previous) => [
            enrichedProject,
            ...previous,
          ],
        );

        toast.success(
          response?.message ||
            "Project created successfully.",
        );

        return true;
      } catch (error) {
        toast.error(
          error?.message ||
            "Unable to create project.",
        );

        return false;
      } finally {
        setIsCreating(false);
      }
    };

  // ==========================================
  // OPEN EDIT PROJECT MODAL
  // ==========================================

  const handleOpenEdit = (
    project,
  ) => {
    if (
      project?.current_user_role !==
      "ADMIN"
    ) {
      toast.error(
        "Only the Project Admin can update this project.",
      );

      return;
    }

    /*
      Archived projects should not normally
      exist in this list because they are
      filtered before rendering.
    */

    if (
      project?.status ===
      "ARCHIVED"
    ) {
      toast.error(
        "Archived projects cannot be modified.",
      );

      return;
    }

    setSelectedProject(project);

    setIsEditModalOpen(true);
  };

  // ==========================================
  // CLOSE EDIT PROJECT MODAL
  // ==========================================

  const handleCloseEdit = () => {
    if (isUpdating) {
      return;
    }

    setIsEditModalOpen(false);

    setSelectedProject(null);
  };

  // ==========================================
  // UPDATE PROJECT
  //
  // PATCH /api/projects/{projectId}/
  //
  // Backend success:
  //
  // {
  //   message: "...",
  //   data: {
  //     updated project
  //   }
  // }
  // ==========================================

  const handleUpdateProject =
    async (projectData) => {
      if (!selectedProject?.id) {
        toast.error(
          "Project ID is missing.",
        );

        return false;
      }

      try {
        setIsUpdating(true);

        const response =
          await updateProject(
            selectedProject.id,
            projectData,
          );

        const updatedProject =
          response?.data;

        if (!updatedProject?.id) {
          throw new Error(
            "Project was updated but updated project data was not returned.",
          );
        }

        /*
          If the user changes project status
          to ARCHIVED through Edit Project,
          remove it immediately from UI.

          Because archived projects are treated
          as hidden / soft-deleted projects.
        */

        if (
          updatedProject.status ===
          "ARCHIVED"
        ) {
          setProjects(
            (previousProjects) =>
              previousProjects.filter(
                (project) =>
                  project.id !==
                  updatedProject.id,
              ),
          );

          toast.success(
            response?.message ||
              "Project archived successfully.",
          );

          setIsEditModalOpen(
            false,
          );

          setSelectedProject(
            null,
          );

          return true;
        }

        /*
          Keep existing members/tasks/progress.

          PATCH response contains the updated
          base project fields but does not need
          to re-fetch members/tasks.
        */

        setProjects(
          (previousProjects) =>
            previousProjects.map(
              (project) =>
                project.id ===
                updatedProject.id
                  ? {
                      ...project,

                      ...updatedProject,

                      members:
                        project.members ||
                        [],

                      members_count:
                        project.members_count ??
                        0,

                      total_tasks:
                        project.total_tasks ??
                        0,

                      completed_tasks:
                        project.completed_tasks ??
                        0,

                      progress:
                        project.progress ??
                        0,
                    }
                  : project,
            ),
        );

        toast.success(
          response?.message ||
            "Project updated successfully.",
        );

        setIsEditModalOpen(false);

        setSelectedProject(null);

        return true;
      } catch (error) {
        toast.error(
          error?.message ||
            "Unable to update project.",
        );

        return false;
      } finally {
        setIsUpdating(false);
      }
    };

  // ==========================================
  // OPEN DELETE PROJECT MODAL
  // ==========================================

  const handleOpenDelete = (
    project,
  ) => {
    if (
      project?.current_user_role !==
      "ADMIN"
    ) {
      toast.error(
        "Only the Project Admin can delete this project.",
      );

      return;
    }

    setSelectedProject(project);

    setIsDeleteModalOpen(true);
  };

  // ==========================================
  // CLOSE DELETE PROJECT MODAL
  // ==========================================

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);

    setSelectedProject(null);
  };

  // ==========================================
  // DELETE PROJECT
  //
  // DELETE /api/projects/{projectId}/
  //
  // Backend behavior:
  //
  // Soft delete:
  // status becomes ARCHIVED
  //
  // Success:
  // 204 No Content
  // ==========================================

  const handleDeleteProject =
    async () => {
      if (!selectedProject?.id) {
        toast.error(
          "Project ID is missing.",
        );

        return false;
      }

      try {
        setIsDeleting(true);

        const deletedProjectId =
          selectedProject.id;

        /*
          Backend performs soft delete.

          It may change:

          ACTIVE
             ↓
          ARCHIVED

          and return:

          204 No Content
        */

        await deleteProject(
          deletedProjectId,
        );

        /*
          Immediately remove the deleted /
          archived project from frontend state.

          This gives instant UI feedback.
        */

        setProjects(
          (previousProjects) =>
            previousProjects.filter(
              (project) =>
                project.id !==
                deletedProjectId,
            ),
        );

        toast.success(
          "Project deleted successfully.",
        );

        setIsDeleteModalOpen(false);

        setSelectedProject(null);

        return true;
      } catch (error) {
        toast.error(
          error?.message ||
            "Unable to delete project.",
        );

        return false;
      } finally {
        setIsDeleting(false);
      }
    };

  // ==========================================
  // FILTER PROJECTS
  // ==========================================

  const filteredProjects =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return projects.filter(
        (project) => {
          /*
            Second safety layer.

            Even if an archived project somehow
            reaches state, never render its card.
          */

          if (
            project?.status ===
            "ARCHIVED"
          ) {
            return false;
          }

          const name =
            project?.name?.toLowerCase() ||
            "";

          const description =
            project?.description?.toLowerCase() ||
            "";

          const projectKey =
            project?.project_key?.toLowerCase() ||
            "";

          const matchesSearch =
            !query ||
            name.includes(query) ||
            description.includes(
              query,
            ) ||
            projectKey.includes(
              query,
            );

          if (!matchesSearch) {
            return false;
          }

          switch (
            activeFilter
          ) {
            case "Owned by me":
              return (
                project.current_user_role ===
                "ADMIN"
              );

            case "Member":
              return (
                project.current_user_role ===
                "MEMBER"
              );

            case "Active":
              return (
                project.status ===
                "ACTIVE"
              );

            case "Completed":
              return (
                project.status ===
                "COMPLETED"
              );

            default:
              return true;
          }
        },
      );
    }, [
      projects,
      search,
      activeFilter,
    ]);

  const filters = [
    "All",
    "Owned by me",
    "Member",
    "Active",
    "Completed",
  ];

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F7F9FC]">
      <div
        className="
          mx-auto
          w-full
          max-w-[1180px]
          px-5
          py-6
          lg:px-7
        "
      >
        {/* =====================================
            PAGE HEADER
        ====================================== */}

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-3xl
                font-black
                tracking-[-1px]
                text-[#14223A]
              "
            >
              Projects
            </h1>

            <p className="mt-1 text-base text-slate-500">
              All projects you own
              or belong to.
            </p>
          </div>

          {/* Create Project */}

          <button
            type="button"
            onClick={() =>
              setIsCreateModalOpen(
                true,
              )
            }
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              gap-2
              self-start
              rounded-xl
              bg-[#3563E9]
              px-5
              py-3
              text-sm
              font-extrabold
              text-white
              shadow-[0_8px_20px_rgba(53,99,233,0.24)]
              transition
              hover:bg-[#2F58D3]
            "
          >
            <span className="text-lg font-light leading-none">
              +
            </span>

            Create project
          </button>
        </div>

        {/* =====================================
            SEARCH
        ====================================== */}

        <div className="mt-6 w-full max-w-[560px]">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-slate-400
              "
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search projects..."
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                py-3
                pl-12
                pr-4
                text-base
                text-[#14223A]
                shadow-sm
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#3563E9]
                focus:ring-4
                focus:ring-[#3563E9]/10
              "
            />
          </div>
        </div>

        {/* =====================================
            FILTERS
        ====================================== */}

        <div className="mt-4 max-w-full overflow-x-auto">
          <div
            className="
              inline-flex
              min-w-max
              gap-1
              rounded-xl
              bg-[#EAF0F8]
              p-1
            "
          >
            {filters.map(
              (filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      filter,
                    )
                  }
                  className={`
                    whitespace-nowrap
                    rounded-lg
                    px-4
                    py-2
                    text-sm
                    font-bold
                    transition
                    ${
                      activeFilter ===
                      filter
                        ? "bg-white text-[#14223A] shadow-sm"
                        : "text-slate-600 hover:bg-white/60"
                    }
                  `}
                >
                  {filter}
                </button>
              ),
            )}
          </div>
        </div>

        {/* =====================================
            PROJECT CARDS
        ====================================== */}

        <div className="mt-6">
          {isLoading ? (
            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fill, minmax(320px, 420px))",

                gap: "20px",

                justifyContent:
                  "start",

                alignItems:
                  "start",
              }}
            >
              <ProjectSkeleton />

              <ProjectSkeleton />
            </div>
          ) : filteredProjects.length >
            0 ? (
            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fill, minmax(320px, 420px))",

                gap: "20px",

                justifyContent:
                  "start",

                alignItems:
                  "start",
              }}
            >
              {filteredProjects.map(
                (project) => (
                  <ProjectCard
                    key={project.id}
                    project={
                      project
                    }
                    onEdit={
                      handleOpenEdit
                    }
                    onDelete={
                      handleOpenDelete
                    }
                  />
                ),
              )}
            </div>
          ) : (
            /* Empty State */

            <div
              style={{
                width: "100%",
                maxWidth: "420px",
              }}
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                px-6
                py-8
                text-center
              "
            >
              <h2 className="text-lg font-black text-[#14223A]">
                No projects found
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a project to
                start organizing your
                team's work.
              </p>

              <button
                type="button"
                onClick={() =>
                  setIsCreateModalOpen(
                    true,
                  )
                }
                className="
                  mt-5
                  rounded-xl
                  bg-[#3563E9]
                  px-5
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-[#2F58D3]
                "
              >
                + Create project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =====================================
          CREATE PROJECT MODAL
      ====================================== */}

      <CreateProjectModal
        isOpen={
          isCreateModalOpen
        }
        onClose={() =>
          setIsCreateModalOpen(
            false,
          )
        }
        onCreate={
          handleCreateProject
        }
        isCreating={
          isCreating
        }
      />

      {/* =====================================
          EDIT PROJECT MODAL
      ====================================== */}

      <EditProjectModal
        isOpen={
          isEditModalOpen
        }
        project={
          selectedProject
        }
        onClose={
          handleCloseEdit
        }
        onUpdate={
          handleUpdateProject
        }
        isUpdating={
          isUpdating
        }
      />

      {/* =====================================
          DELETE PROJECT MODAL
      ====================================== */}

      <DeleteProjectModal
        isOpen={
          isDeleteModalOpen
        }
        project={
          selectedProject
        }
        onClose={
          handleCloseDelete
        }
        onDelete={
          handleDeleteProject
        }
        isDeleting={
          isDeleting
        }
      />
    </div>
  );
};

// ==========================================
// PROJECT LOADING SKELETON
// ==========================================

const ProjectSkeleton = () => {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
      }}
      className="
        animate-pulse
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
      "
    >
      {/* Header */}

      <div className="flex items-center justify-between">
        <div className="h-5 w-16 rounded bg-slate-100" />

        <div className="flex gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-100" />

          <div className="h-5 w-14 rounded-full bg-slate-100" />
        </div>
      </div>

      {/* Name */}

      <div className="mt-3 h-5 w-40 rounded bg-slate-200" />

      {/* Description */}

      <div className="mt-2 h-4 w-52 rounded bg-slate-100" />

      {/* Members / Tasks */}

      <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
        <div>
          <div className="h-3 w-16 rounded bg-slate-100" />

          <div className="mt-2 h-8 w-8 rounded-full bg-slate-200" />
        </div>

        <div>
          <div className="h-3 w-12 rounded bg-slate-100" />

          <div className="mt-2 h-6 w-8 rounded bg-slate-200" />
        </div>
      </div>

      {/* Progress */}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-slate-100" />

          <div className="h-3 w-7 rounded bg-slate-100" />
        </div>

        <div className="mt-2 h-1.5 rounded-full bg-slate-100" />
      </div>
    </div>
  );
};

export default Projects;