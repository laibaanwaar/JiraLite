import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import { toast } from "react-toastify";

import {
  getDashboardProfile,
  getDashboardProjectMembers,
  getDashboardProjects,
  getDashboardProjectTasks,
} from "../services/dashboardService";

// ==========================================
// PAGINATION CONFIGURATION
// ==========================================
//
// Screenshot shows one large project card.
// Therefore show 1 project per dashboard page.
//
// Tasks table shows compact rows.
// Show 5 tasks per dashboard page.
//
const PROJECTS_PER_PAGE = 1;
const TASKS_PER_PAGE = 5;

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [projects, setProjects] =
    useState([]);

  const [
    assignedTasks,
    setAssignedTasks,
  ] = useState([]);

  const [
    projectPage,
    setProjectPage,
  ] = useState(1);

  const [
    taskPage,
    setTaskPage,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // EXTRACT PROFILE OBJECT
  // ==========================================

  const extractProfile = (
    response,
  ) => {
    /*
      Supports common backend shapes:

      {
        data: {
          id,
          first_name,
          ...
        }
      }

      or

      {
        data: {
          user: {...}
        }
      }
    */

    return (
      response?.data?.user ||
      response?.data ||
      null
    );
  };

  // ==========================================
  // EXTRACT PROJECT LIST
  // ==========================================

  const extractProjects = (
    response,
  ) => {
    if (
      Array.isArray(
        response?.data,
      )
    ) {
      return response.data;
    }

    if (
      Array.isArray(
        response?.data?.projects,
      )
    ) {
      return response.data.projects;
    }

    return [];
  };

  // ==========================================
  // GET TASK ASSIGNED USER ID
  // ==========================================
  //
  // Supports different serializer shapes:
  //
  // assigned_to: 7
  //
  // assigned_to: {
  //   id: 7,
  //   first_name: ...
  // }
  //
  // assigned_user: {...}
  //
  // assignee: {...}
  //
  // assigned_to_id: 7
  //
  const getAssignedUserId = (
    task,
  ) => {
    if (
      task?.assigned_to &&
      typeof task.assigned_to ===
        "object"
    ) {
      return Number(
        task.assigned_to.id,
      );
    }

    if (
      task?.assigned_user &&
      typeof task.assigned_user ===
        "object"
    ) {
      return Number(
        task.assigned_user.id,
      );
    }

    if (
      task?.assignee &&
      typeof task.assignee ===
        "object"
    ) {
      return Number(
        task.assignee.id,
      );
    }

    return Number(
      task?.assigned_to_id ??
        task?.assigned_to ??
        task?.assignee_id ??
        0,
    );
  };

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError("");

      /*
        Load profile and project list
        at the same time.
      */

      const [
        profileResponse,
        projectsResponse,
      ] = await Promise.all([
        getDashboardProfile(),
        getDashboardProjects(),
      ]);

      const currentUser =
        extractProfile(
          profileResponse,
        );

      /*
        Get every project returned
        by the backend first.
      */

      const allProjects =
        extractProjects(
          projectsResponse,
        );

      /*
        ========================================
        SOFT DELETE / ARCHIVED PROJECT FIX
        ========================================

        Backend performs soft delete.

        When a project is deleted:

        ACTIVE / COMPLETED
                ↓
        ARCHIVED

        The project may still be returned by:

        GET /api/projects/

        Dashboard must NOT:

        - show archived projects
        - count archived projects
        - fetch archived project members
        - fetch archived project tasks
        - include archived tasks in stats
        - include archived projects in pagination

        Therefore filter them BEFORE
        calling members/tasks APIs.
      */

      const baseProjects =
        allProjects.filter(
          (project) =>
            project?.status !==
            "ARCHIVED",
        );

      setUser(currentUser);

      /*
        For each VISIBLE project fetch:

        - members
        - tasks

        This gives real data for:

        - project member avatars
        - project task count
        - current user's assigned tasks

        Archived projects are already
        removed above, therefore no
        members/tasks API calls are made
        for soft-deleted projects.
      */

      const enrichedProjects =
        await Promise.all(
          baseProjects.map(
            async (project) => {
              const [
                membersResult,
                tasksResult,
              ] =
                await Promise.allSettled(
                  [
                    getDashboardProjectMembers(
                      project.id,
                    ),

                    getDashboardProjectTasks(
                      project.id,
                    ),
                  ],
                );

              const members =
                membersResult.status ===
                "fulfilled"
                  ? membersResult.value
                      ?.data
                      ?.members || []
                  : [];

              const tasks =
                tasksResult.status ===
                "fulfilled"
                  ? tasksResult.value
                      ?.data
                      ?.tasks || []
                  : [];

              return {
                ...project,

                members,

                members_count:
                  members.length,

                tasks,

                total_tasks:
                  tasks.length,
              };
            },
          ),
        );

      /*
        Only active/non-archived projects
        are now stored in dashboard state.
      */

      setProjects(
        enrichedProjects,
      );

      /*
        Combine all project tasks and
        keep only tasks assigned to
        logged-in user.

        Since enrichedProjects contains
        only non-archived projects,
        tasks belonging to deleted /
        archived projects are automatically
        excluded from dashboard statistics.
      */

      const currentUserId = Number(
        currentUser?.id || 0,
      );

      const allAssignedTasks =
        enrichedProjects
          .flatMap(
            (project) =>
              project.tasks.map(
                (task) => ({
                  ...task,

                  project_id:
                    project.id,

                  project_name:
                    project.name,

                  project_key:
                    project.project_key,
                }),
              ),
          )
          .filter((task) => {
            if (!currentUserId) {
              return false;
            }

            return (
              getAssignedUserId(
                task,
              ) === currentUserId
            );
          });

      /*
        Keep tasks with nearest due date
        first when due dates exist.
      */

      const sortedTasks = [
        ...allAssignedTasks,
      ].sort((a, b) => {
        if (
          !a?.due_date &&
          !b?.due_date
        ) {
          return 0;
        }

        if (!a?.due_date) {
          return 1;
        }

        if (!b?.due_date) {
          return -1;
        }

        return (
          new Date(a.due_date) -
          new Date(b.due_date)
        );
      });

      setAssignedTasks(
        sortedTasks,
      );

      /*
        Reset pagination after refresh.

        This prevents the dashboard from
        remaining on a page number that
        no longer exists after projects
        are deleted / archived.
      */

      setProjectPage(1);
      setTaskPage(1);
    } catch (err) {
      const message =
        err?.message ||
        "Unable to load dashboard.";

      setError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const stats = useMemo(
    () => ({
      /*
        Projects count now contains only
        non-archived projects because
        archived projects were filtered
        inside loadDashboard().
      */

      projects:
        projects.length,

      assignedTasks:
        assignedTasks.length,

      inProgress:
        assignedTasks.filter(
          (task) =>
            task.status ===
            "IN_PROGRESS",
        ).length,

      completed:
        assignedTasks.filter(
          (task) =>
            task.status ===
            "DONE",
        ).length,
    }),
    [
      projects,
      assignedTasks,
    ],
  );

  // ==========================================
  // PROJECT PAGINATION
  // ==========================================

  const projectTotalPages =
    Math.max(
      1,
      Math.ceil(
        projects.length /
          PROJECTS_PER_PAGE,
      ),
    );

  const paginatedProjects =
    useMemo(() => {
      const start =
        (projectPage - 1) *
        PROJECTS_PER_PAGE;

      return projects.slice(
        start,
        start +
          PROJECTS_PER_PAGE,
      );
    }, [
      projects,
      projectPage,
    ]);

  // ==========================================
  // TASK PAGINATION
  // ==========================================

  const taskTotalPages =
    Math.max(
      1,
      Math.ceil(
        assignedTasks.length /
          TASKS_PER_PAGE,
      ),
    );

  const paginatedTasks =
    useMemo(() => {
      const start =
        (taskPage - 1) *
        TASKS_PER_PAGE;

      return assignedTasks.slice(
        start,
        start +
          TASKS_PER_PAGE,
      );
    }, [
      assignedTasks,
      taskPage,
    ]);

  // ==========================================
  // FORMAT USER NAME
  // ==========================================

  const firstName =
    user?.first_name?.trim() ||
    user?.email
      ?.split("@")[0]
      ?.trim() ||
    "User";

  // ==========================================
  // GREETING
  // ==========================================

  const greeting = (() => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  })();

  // ==========================================
  // MEMBER INITIALS
  // ==========================================

  const getInitials = (
    member,
  ) => {
    const memberUser =
      member?.user || member;

    const first =
      memberUser?.first_name
        ?.charAt(0) || "";

    const last =
      memberUser?.last_name
        ?.charAt(0) || "";

    return (
      `${first}${last}`.toUpperCase() ||
      "U"
    );
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDueDate = (
    value,
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
      },
    ).format(date);
  };

  // ==========================================
  // PRIORITY STYLE
  // ==========================================

  const getPriorityStyle = (
    priority,
  ) => {
    switch (priority) {
      case "HIGH":
        return {
          label: "High",

          classes:
            "border-red-200 bg-red-50 text-red-600",

          dot:
            "bg-red-500",
        };

      case "LOW":
        return {
          label: "Low",

          classes:
            "border-emerald-200 bg-emerald-50 text-emerald-600",

          dot:
            "bg-emerald-500",
        };

      default:
        return {
          label: "Medium",

          classes:
            "border-amber-200 bg-amber-50 text-amber-600",

          dot:
            "bg-amber-500",
        };
    }
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getTaskStatusStyle = (
    status,
  ) => {
    switch (status) {
      case "DONE":
        return {
          label: "Done",

          classes:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        };

      case "IN_PROGRESS":
        return {
          label: "In progress",

          classes:
            "border-blue-200 bg-blue-50 text-blue-700",
        };

      default:
        return {
          label: "To do",

          classes:
            "border-slate-200 bg-slate-100 text-slate-600",
        };
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#F7F9FC] p-5 lg:p-7">
        <div className="mx-auto max-w-[1180px] animate-pulse">

          <div className="h-10 w-72 rounded bg-slate-200" />

          <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-100" />

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="h-[145px] rounded-2xl border border-slate-200 bg-white"
              />
            ))}

          </div>

          <div className="mt-8 h-[280px] rounded-2xl border border-slate-200 bg-white" />

          <div className="mt-8 h-[320px] rounded-2xl border border-slate-200 bg-white" />

        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F7F9FC] p-6">

        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center">

          <h2 className="text-xl font-black text-[#14223A]">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadDashboard
            }
            className="mt-5 rounded-xl bg-[#3563E9] px-5 py-3 font-bold text-white"
          >
            Try again
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F7F9FC]">

      <main className="mx-auto w-full max-w-[1180px] px-5 py-7 lg:px-7">

        {/* =====================================
            GREETING
        ====================================== */}

        <section>

          <h1 className="text-3xl font-black tracking-[-1px] text-[#071B3B] sm:text-4xl">
            {greeting},{" "}
            {firstName}
          </h1>

          <p className="mt-2 text-base text-slate-500 sm:text-lg">
            Here's what's happening
            with your work today.
          </p>

        </section>

        {/* =====================================
            STAT CARDS
        ====================================== */}

        <section className="mt-8 grid gap-5 md:grid-cols-2">

          <DashboardStatCard
            title="PROJECTS"
            value={
              stats.projects
            }
            type="projects"
          />

          <DashboardStatCard
            title="ASSIGNED TASKS"
            value={
              stats.assignedTasks
            }
            type="assigned"
          />

          <DashboardStatCard
            title="IN PROGRESS"
            value={
              stats.inProgress
            }
            type="progress"
          />

          <DashboardStatCard
            title="COMPLETED"
            value={
              stats.completed
            }
            type="completed"
          />

        </section>

        {/* =====================================
            MY PROJECTS
        ====================================== */}

        <section className="mt-9">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-black text-[#071B3B]">
              My projects
            </h2>

            <Link
              to="/projects"
              className="text-sm font-bold text-[#3563E9] transition hover:text-[#234ED4]"
            >
              View all
            </Link>

          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,30,51,0.06)] sm:p-7">

            {paginatedProjects.length >
            0 ? (
              paginatedProjects.map(
                (project) => (
                  <DashboardProjectCard
                    key={
                      project.id
                    }
                    project={
                      project
                    }
                    getInitials={
                      getInitials
                    }
                    onOpen={() =>
                      navigate(
                        `/projects/${project.id}`,
                      )
                    }
                  />
                ),
              )
            ) : (
              <EmptySection
                title="No projects yet"
                text="You are not currently part of any active or completed project."
              />
            )}

            {/* PROJECT PAGINATION */}

            {projects.length >
              PROJECTS_PER_PAGE && (
              <Pagination
                currentPage={
                  projectPage
                }
                totalPages={
                  projectTotalPages
                }
                onPrevious={() =>
                  setProjectPage(
                    (previous) =>
                      Math.max(
                        previous -
                          1,
                        1,
                      ),
                  )
                }
                onNext={() =>
                  setProjectPage(
                    (previous) =>
                      Math.min(
                        previous +
                          1,
                        projectTotalPages,
                      ),
                  )
                }
                onPageChange={
                  setProjectPage
                }
              />
            )}

          </div>

        </section>

        {/* =====================================
            MY TASKS
        ====================================== */}

        <section className="mt-9 pb-8">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-black text-[#071B3B]">
              My tasks
            </h2>

            <Link
              to="/projects"
              className="text-sm font-bold text-[#3563E9] transition hover:text-[#234ED4]"
            >
              View all
            </Link>

          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,30,51,0.06)]">

            {paginatedTasks.length >
            0 ? (
              <>
                {/* DESKTOP TABLE */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full table-fixed">

                    <thead className="bg-[#F8FAFC]">

                      <tr className="text-left text-xs font-bold uppercase tracking-[0.05em] text-slate-500">

                        <th className="w-[24%] px-6 py-4">
                          Task
                        </th>

                        <th className="w-[27%] px-6 py-4">
                          Project
                        </th>

                        <th className="w-[18%] px-6 py-4">
                          Priority
                        </th>

                        <th className="w-[18%] px-6 py-4">
                          Status
                        </th>

                        <th className="w-[13%] px-6 py-4">
                          Due
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {paginatedTasks.map(
                        (task) => {
                          const priority =
                            getPriorityStyle(
                              task.priority,
                            );

                          const status =
                            getTaskStatusStyle(
                              task.status,
                            );

                          return (
                            <tr
                              key={
                                task.id
                              }
                              className="border-t border-slate-100 transition hover:bg-slate-50"
                            >

                              <td className="px-6 py-5">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/projects/${task.project_id}`,
                                    )
                                  }
                                  className="text-left text-sm font-bold text-[#071B3B] hover:text-[#3563E9]"
                                >
                                  {task.title ||
                                    "Untitled task"}
                                </button>

                              </td>

                              <td className="px-6 py-5 text-sm text-slate-600">
                                {
                                  task.project_name
                                }
                              </td>

                              <td className="px-6 py-5">

                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-lg
                                    border
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-bold
                                    ${priority.classes}
                                  `}
                                >

                                  <span
                                    className={`h-2 w-2 rounded-full ${priority.dot}`}
                                  />

                                  {
                                    priority.label
                                  }

                                </span>

                              </td>

                              <td className="px-6 py-5">

                                <span
                                  className={`
                                    inline-flex
                                    rounded-lg
                                    border
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-bold
                                    ${status.classes}
                                  `}
                                >
                                  {
                                    status.label
                                  }
                                </span>

                              </td>

                              <td className="px-6 py-5 text-sm font-medium text-slate-600">
                                {formatDueDate(
                                  task.due_date,
                                )}
                              </td>

                            </tr>
                          );
                        },
                      )}

                    </tbody>

                  </table>

                </div>

                {/* MOBILE TASK CARDS */}

                <div className="divide-y divide-slate-100 md:hidden">

                  {paginatedTasks.map(
                    (task) => {
                      const priority =
                        getPriorityStyle(
                          task.priority,
                        );

                      const status =
                        getTaskStatusStyle(
                          task.status,
                        );

                      return (
                        <div
                          key={
                            task.id
                          }
                          className="p-5"
                        >

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/projects/${task.project_id}`,
                              )
                            }
                            className="text-left text-base font-black text-[#071B3B]"
                          >
                            {task.title ||
                              "Untitled task"}
                          </button>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              task.project_name
                            }
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">

                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-2
                                rounded-lg
                                border
                                px-3
                                py-1.5
                                text-xs
                                font-bold
                                ${priority.classes}
                              `}
                            >

                              <span
                                className={`h-2 w-2 rounded-full ${priority.dot}`}
                              />

                              {
                                priority.label
                              }

                            </span>

                            <span
                              className={`
                                rounded-lg
                                border
                                px-3
                                py-1.5
                                text-xs
                                font-bold
                                ${status.classes}
                              `}
                            >
                              {
                                status.label
                              }
                            </span>

                            <span className="ml-auto text-xs font-semibold text-slate-500">
                              Due{" "}
                              {formatDueDate(
                                task.due_date,
                              )}
                            </span>

                          </div>

                        </div>
                      );
                    },
                  )}

                </div>
              </>
            ) : (
              <div className="p-7">

                <EmptySection
                  title="No assigned tasks"
                  text="No tasks from your current projects are assigned to you."
                />

              </div>
            )}

            {/* TASK PAGINATION */}

            {assignedTasks.length >
              TASKS_PER_PAGE && (
              <div className="border-t border-slate-100 px-5 pb-5">

                <Pagination
                  currentPage={
                    taskPage
                  }
                  totalPages={
                    taskTotalPages
                  }
                  onPrevious={() =>
                    setTaskPage(
                      (previous) =>
                        Math.max(
                          previous -
                            1,
                          1,
                        ),
                    )
                  }
                  onNext={() =>
                    setTaskPage(
                      (previous) =>
                        Math.min(
                          previous +
                            1,
                          taskTotalPages,
                        ),
                    )
                  }
                  onPageChange={
                    setTaskPage
                  }
                />

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
};

// ==========================================
// DASHBOARD STAT CARD
// ==========================================

const DashboardStatCard = ({
  title,
  value,
  type,
}) => {
  const iconStyles = {
    projects:
      "bg-indigo-50 text-[#3563E9]",

    assigned:
      "bg-slate-100 text-slate-500",

    progress:
      "bg-amber-100 text-amber-600",

    completed:
      "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="flex min-h-[145px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-7 py-6 shadow-[0_5px_18px_rgba(15,30,51,0.06)]">

      <div>

        <p className="text-sm font-medium uppercase tracking-[0.03em] text-slate-500">
          {title}
        </p>

        <p className="mt-3 text-4xl font-black leading-none text-[#071B3B]">
          {value}
        </p>

      </div>

      <div
        className={`
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-xl
          ${
            iconStyles[type] ||
            iconStyles.projects
          }
        `}
      >

        <StatIcon
          type={type}
        />

      </div>

    </div>
  );
};

// ==========================================
// STAT ICON
// ==========================================

const StatIcon = ({ type }) => {
  if (type === "projects") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-7 w-7"
      >
        <path d="M4 7h6l2 2h8v10H4z" />

        <path d="M8 13v3" />

        <path d="M12 12v4" />

        <path d="M16 14v2" />

      </svg>
    );
  }

  if (type === "assigned") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-7 w-7"
      >
        <path d="M9 11l3 3 6-6" />

        <path d="M20 12v7H4V5h11" />

      </svg>
    );
  }

  if (type === "progress") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-7 w-7"
      >
        <path d="M20 12a8 8 0 1 1-4-6.93" />

      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-7 w-7"
    >

      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="m8 12 2.5 2.5L16 9" />

    </svg>
  );
};

// ==========================================
// DASHBOARD PROJECT CARD
// ==========================================

const DashboardProjectCard = ({
  project,
  getInitials,
  onOpen,
}) => {
  const members =
    Array.isArray(
      project?.members,
    )
      ? project.members
      : [];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="
        w-full
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        text-left
        transition
        hover:border-[#3563E9]/40
        hover:shadow-[0_8px_24px_rgba(53,99,233,0.08)]
        sm:p-6
      "
    >

      <div className="flex items-start justify-between gap-4">

        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase text-slate-500">
          {project?.project_key ||
            "PRJ"}
        </span>

        {project?.current_user_role && (
          <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-[#3563E9]">
            {
              project.current_user_role
            }
          </span>
        )}

      </div>

      <h3 className="mt-5 text-xl font-black text-[#071B3B]">
        {project?.name ||
          "Untitled Project"}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 sm:text-base">
        {project?.description ||
          "No project description."}
      </p>

      <div className="mt-6 flex items-end justify-between gap-4">

        {/* MEMBER AVATARS */}

        <div className="flex items-center">

          {members.length > 0 ? (
            <div className="flex -space-x-2">

              {members
                .slice(0, 3)
                .map(
                  (
                    member,
                    index,
                  ) => (
                    <div
                      key={
                        member?.id ??
                        index
                      }
                      title={
                        member?.user
                          ?.email ||
                        ""
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#536DFE] to-[#795CF8] text-xs font-black text-white"
                    >
                      {getInitials(
                        member,
                      )}
                    </div>
                  ),
                )}

              {members.length >
                3 && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black text-slate-600">
                  +
                  {members.length -
                    3}
                </div>
              )}

            </div>
          ) : (
            <span className="text-sm text-slate-400">
              No members
            </span>
          )}

        </div>

        <span className="text-sm font-semibold text-slate-500">
          {project?.total_tasks ??
            0}{" "}

          {(project?.total_tasks ??
            0) === 1
            ? "task"
            : "tasks"}
        </span>

      </div>

    </button>
  );
};

// ==========================================
// PAGINATION
// ==========================================

const Pagination = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onPageChange,
}) => {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">

      <p className="text-xs font-semibold text-slate-500">
        Page {currentPage} of{" "}
        {totalPages}
      </p>

      <div className="flex items-center gap-2">

        <button
          type="button"
          onClick={onPrevious}
          disabled={
            currentPage === 1
          }
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-white
            font-bold
            text-slate-600
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Previous page"
        >
          ‹
        </button>

        {Array.from(
          {
            length:
              totalPages,
          },
          (_, index) =>
            index + 1,
        )
          .slice(
            Math.max(
              currentPage - 3,
              0,
            ),
            Math.max(
              currentPage - 3,
              0,
            ) + 5,
          )
          .map((page) => (
            <button
              key={page}
              type="button"
              onClick={() =>
                onPageChange(
                  page,
                )
              }
              className={`
                flex
                h-9
                min-w-9
                items-center
                justify-center
                rounded-lg
                px-2
                text-xs
                font-bold
                transition
                ${
                  page ===
                  currentPage
                    ? "bg-[#3563E9] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }
              `}
            >
              {page}
            </button>
          ))}

        <button
          type="button"
          onClick={onNext}
          disabled={
            currentPage ===
            totalPages
          }
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-white
            font-bold
            text-slate-600
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Next page"
        >
          ›
        </button>

      </div>

    </div>
  );
};

// ==========================================
// EMPTY SECTION
// ==========================================

const EmptySection = ({
  title,
  text,
}) => {
  return (
    <div className="py-9 text-center">

      <h3 className="text-base font-black text-[#071B3B]">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {text}
      </p>

    </div>
  );
};

export default Dashboard;