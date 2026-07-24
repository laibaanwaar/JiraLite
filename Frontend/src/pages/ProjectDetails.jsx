import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import { toast } from "react-toastify";

import CreateTaskModal from "../components/projects/CreateTaskModal";
import InviteMemberModal from "../components/projects/InviteMemberModal";
import ProjectStatCard from "../components/projects/ProjectStatCard";

import {
  createProjectTask,
  getProjectDetails,
  getProjectMembers,
  getProjectTasks,
  inviteProjectMembers,
} from "../services/projectService";

const ProjectDetails = () => {
  const { projectId } = useParams();

  const navigate = useNavigate();

  const [project, setProject] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("Overview");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // MODAL STATES
  // ==========================================

  const [
    isCreateTaskModalOpen,
    setIsCreateTaskModalOpen,
  ] = useState(false);

  const [
    isInviteMemberModalOpen,
    setIsInviteMemberModalOpen,
  ] = useState(false);

  const [
    isCreatingTask,
    setIsCreatingTask,
  ] = useState(false);

  const [
    isInvitingMembers,
    setIsInvitingMembers,
  ] = useState(false);

  // ==========================================
  // LOAD SELECTED PROJECT
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadProjectData = async () => {
      if (!projectId) {
        if (isMounted) {
          setError(
            "Project ID is missing.",
          );

          setIsLoading(false);
        }

        return;
      }

      try {
        setIsLoading(true);
        setError("");

        /*
          --------------------------------------
          STEP 1:
          PROJECT DETAILS ARE REQUIRED
          --------------------------------------

          GET /api/projects/{id}/
        */

        const projectResponse =
          await getProjectDetails(
            projectId,
          );

        if (!isMounted) {
          return;
        }

        const projectData =
          projectResponse?.data;

        if (!projectData?.id) {
          throw new Error(
            "Project details were not returned by the server.",
          );
        }

        setProject(projectData);

        /*
          --------------------------------------
          STEP 2:
          MEMBERS + TASKS

          These should not make the whole
          page fail if one endpoint fails.
          --------------------------------------
        */

        const [
          membersResult,
          tasksResult,
        ] = await Promise.allSettled([
          getProjectMembers(
            projectId,
          ),

          getProjectTasks(
            projectId,
          ),
        ]);

        if (!isMounted) {
          return;
        }

        // =====================================
        // MEMBERS RESULT
        // =====================================

        if (
          membersResult.status ===
          "fulfilled"
        ) {
          const membersData =
            membersResult.value?.data
              ?.members;

          setMembers(
            Array.isArray(
              membersData,
            )
              ? membersData
              : [],
          );
        } else {
          console.error(
            "Project members API failed:",
            membersResult.reason,
          );

          setMembers([]);

          toast.error(
            membersResult.reason
              ?.message ||
              "Unable to load project members.",
          );
        }

        // =====================================
        // TASKS RESULT
        // =====================================

        if (
          tasksResult.status ===
          "fulfilled"
        ) {
          const tasksData =
            tasksResult.value?.data
              ?.tasks;

          setTasks(
            Array.isArray(
              tasksData,
            )
              ? tasksData
              : [],
          );
        } else {
          console.error(
            "Project tasks API failed:",
            tasksResult.reason,
          );

          setTasks([]);

          toast.error(
            tasksResult.reason
              ?.message ||
              "Unable to load project tasks.",
          );
        }
      } catch (err) {
        console.error(
          "Project details API failed:",
          err,
        );

        if (!isMounted) {
          return;
        }

        setProject(null);
        setMembers([]);
        setTasks([]);

        setError(
          err?.message ||
            "Unable to load project details.",
        );

        toast.error(
          err?.message ||
            "Unable to load project details.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProjectData();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // ==========================================
  // REFRESH TASKS
  // ==========================================

  const refreshTasks = async () => {
    const tasksResponse =
      await getProjectTasks(
        projectId,
      );

    const refreshedTasks =
      tasksResponse?.data?.tasks;

    setTasks(
      Array.isArray(refreshedTasks)
        ? refreshedTasks
        : [],
    );
  };

  // ==========================================
  // OPEN TASK DETAILS
  // ==========================================
  //
  // Task card/div click:
  //
  // /projects/{projectId}
  //        ↓
  // /tasks/{taskId}
  //
  // TaskDetails.jsx will then fetch:
  //
  // GET /api/tasks/{taskId}/
  //
  // ==========================================

  const handleOpenTask = (
    taskId,
  ) => {
    if (!taskId) {
      toast.error(
        "Task ID is missing.",
      );

      return;
    }

    navigate(
      `/tasks/${taskId}`,
    );
  };

  // ==========================================
  // CREATE TASK
  // ==========================================

  const handleCreateTask = async (
    taskData,
  ) => {
    try {
      setIsCreatingTask(true);

      const response =
        await createProjectTask(
          projectId,
          taskData,
        );

      /*
        Refresh tasks after creation so all
        statistics, Board, Tasks and Team
        Performance update automatically.
      */

      await refreshTasks();

      toast.success(
        response?.message ||
          "Task created successfully.",
      );

      return true;
    } catch (err) {
      console.error(
        "Create task API failed:",
        err,
      );

      toast.error(
        err?.message ||
          "Unable to create task.",
      );

      return false;
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ==========================================
  // INVITE MULTIPLE MEMBERS
  // ==========================================

  const handleInviteMembers = async (
    emails,
  ) => {
    try {
      setIsInvitingMembers(true);

      const response =
        await inviteProjectMembers(
          projectId,
          emails,
        );

      const invited =
        Array.isArray(
          response?.data?.invited,
        )
          ? response.data.invited
          : [];

      const failed =
        Array.isArray(
          response?.data?.failed,
        )
          ? response.data.failed
          : [];

      if (
        invited.length > 0 &&
        failed.length === 0
      ) {
        toast.success(
          response?.message ||
            `${invited.length} invitation(s) sent successfully.`,
        );
      } else if (
        invited.length > 0 &&
        failed.length > 0
      ) {
        toast.warn(
          `${invited.length} invitation(s) sent. ${failed.length} failed.`,
        );
      } else {
        toast.error(
          response?.message ||
            "No invitations were sent.",
        );
      }

      /*
        Return the complete response because
        InviteMemberModal displays failed
        email addresses with their reasons.
      */

      return response;
    } catch (err) {
      console.error(
        "Invite members API failed:",
        err,
      );

      toast.error(
        err?.message ||
          "Unable to send invitations.",
      );

      return null;
    } finally {
      setIsInvitingMembers(false);
    }
  };

  // ==========================================
  // TASK STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    const safeTasks =
      Array.isArray(tasks)
        ? tasks
        : [];

    const totalTasks =
      safeTasks.length;

    const todoTasks =
      safeTasks.filter(
        (task) =>
          task?.status === "TODO",
      ).length;

    const inProgressTasks =
      safeTasks.filter(
        (task) =>
          task?.status ===
          "IN_PROGRESS",
      ).length;

    const completedTasks =
      safeTasks.filter(
        (task) =>
          task?.status === "DONE",
      ).length;

    const progress =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks /
              totalTasks) *
              100,
          );

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      progress,
    };
  }, [tasks]);

  // ==========================================
  // TEAM PERFORMANCE
  // ==========================================

  const teamPerformance =
    useMemo(() => {
      const safeMembers =
        Array.isArray(members)
          ? members
          : [];

      const safeTasks =
        Array.isArray(tasks)
          ? tasks
          : [];

      return safeMembers.map(
        (member) => {
          const user =
            member?.user;

          const userId =
            user?.id;

          const memberTasks =
            safeTasks.filter(
              (task) =>
                task?.assigned_to
                  ?.id === userId,
            );

          const completed =
            memberTasks.filter(
              (task) =>
                task?.status ===
                "DONE",
            ).length;

          const progress =
            memberTasks.length ===
            0
              ? 0
              : Math.round(
                  (completed /
                    memberTasks.length) *
                    100,
                );

          return {
            ...member,

            assigned_tasks:
              memberTasks.length,

            completed_tasks:
              completed,

            progress,
          };
        },
      );
    }, [members, tasks]);

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#F7F9FC]">
        <div className="mx-auto max-w-[1100px] px-5 py-7 lg:px-7">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
          >
            <span className="text-xl">
              ‹
            </span>

            Back to projects
          </Link>

          <div className="mt-8 animate-pulse">
            <div className="h-6 w-52 rounded bg-slate-200" />

            <div className="mt-4 h-10 w-80 max-w-full rounded bg-slate-200" />

            <div className="mt-3 h-5 w-[420px] max-w-full rounded bg-slate-100" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR SCREEN
  // ==========================================

  if (error || !project) {
    return (
      <div className="min-h-full bg-[#F7F9FC]">
        <div className="mx-auto max-w-[1100px] px-5 py-7 lg:px-7">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#3563E9]"
          >
            <span className="text-xl">
              ‹
            </span>

            Back to projects
          </Link>

          <div className="mt-8 max-w-[650px] rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-black text-red-700">
              Unable to load project
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error ||
                "Project not found."}
            </p>

            <Link
              to="/projects"
              className="mt-5 inline-flex rounded-xl bg-[#3563E9] px-5 py-2.5 text-sm font-bold text-white"
            >
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VARIABLES
  // ==========================================

  const isAdmin =
    project?.current_user_role ===
    "ADMIN";

  const tabs = [
    "Overview",
    "Board",
    "Tasks",
    "Members",
    "Activity",
    "Settings",
  ];

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1100px] px-5 py-6 lg:px-7">
        {/* ===================================
            BACK
        ==================================== */}

        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#3563E9]"
        >
          <span className="text-xl">
            ‹
          </span>

          Back to projects
        </Link>

        {/* ===================================
            HEADER
        ==================================== */}

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          {/* PROJECT INFORMATION */}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Project Key */}

              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase text-slate-500">
                {project?.project_key ||
                  "PRJ"}
              </span>

              {/* Status */}

              <span
                className={`
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-extrabold
                  ${
                    project?.status ===
                    "COMPLETED"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : project?.status ===
                          "ARCHIVED"
                        ? "border-slate-200 bg-slate-100 text-slate-600"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                `}
              >
                {project?.status ||
                  "ACTIVE"}
              </span>

              {/* Current User Role */}

              {project?.current_user_role && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-[#3563E9]">
                  {
                    project.current_user_role
                  }
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.7px] text-[#14223A]">
              {project?.name ||
                "Untitled Project"}
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              {project?.description ||
                "No project description."}
            </p>
          </div>

          {/* ===================================
              ADMIN ACTION BUTTONS
          ==================================== */}

          {isAdmin && (
            <div className="flex shrink-0 flex-wrap gap-3">
              {/* INVITE MEMBER */}

              <button
                type="button"
                onClick={() =>
                  setIsInviteMemberModalOpen(
                    true,
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-[#3563E9]
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-extrabold
                  text-[#3563E9]
                  shadow-sm
                  transition
                  hover:bg-blue-50
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />

                  <circle
                    cx="8.5"
                    cy="7"
                    r="4"
                  />

                  <path d="M20 8v6" />

                  <path d="M23 11h-6" />
                </svg>

                Invite member
              </button>

              {/* CREATE TASK */}

              <button
                type="button"
                onClick={() =>
                  setIsCreateTaskModalOpen(
                    true,
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-[#3563E9]
                  bg-[#3563E9]
                  px-5
                  py-3
                  text-sm
                  font-extrabold
                  text-white
                  shadow-[0_7px_18px_rgba(53,99,233,0.24)]
                  transition
                  hover:bg-[#2F58D3]
                "
              >
                <span className="text-xl font-light leading-none">
                  +
                </span>

                Create task
              </button>
            </div>
          )}
        </div>

        {/* ===================================
            TABS
        ==================================== */}

        <div className="mt-7 overflow-x-auto">
          <div className="inline-flex min-w-max gap-1 rounded-xl bg-[#EEF2F8] p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveTab(tab)
                }
                className={`
                  rounded-lg
                  px-4
                  py-2
                  text-sm
                  font-bold
                  transition
                  ${
                    activeTab === tab
                      ? "bg-white text-[#14223A] shadow-sm"
                      : "text-slate-600 hover:bg-white/60"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ===================================
            OVERVIEW
        ==================================== */}

        {activeTab ===
          "Overview" && (
          <div className="mt-7">
            {/* STATS */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProjectStatCard
                label="Members"
                value={members.length}
                icon="♙"
                iconClass="bg-indigo-50 text-[#3563E9]"
              />

              <ProjectStatCard
                label="Total Tasks"
                value={
                  stats.totalTasks
                }
                icon="✓"
                iconClass="bg-slate-100 text-slate-500"
              />

              <ProjectStatCard
                label="To Do"
                value={
                  stats.todoTasks
                }
                icon="○"
                iconClass="bg-blue-50 text-blue-600"
              />

              <ProjectStatCard
                label="In Progress"
                value={
                  stats.inProgressTasks
                }
                icon="↻"
                iconClass="bg-amber-100 text-amber-600"
              />

              <ProjectStatCard
                label="Completed"
                value={
                  stats.completedTasks
                }
                icon="✓"
                iconClass="bg-emerald-100 text-emerald-700"
              />
            </div>

            {/* ===================================
                TEAM PROGRESS
            ==================================== */}

            <section className="mt-6 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,30,51,0.05)]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-lg font-black text-[#14223A]">
                    Team Progress
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Overall team task
                    completion.
                  </p>
                </div>

                <span className="text-3xl font-black text-[#14223A]">
                  {stats.progress}%
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#3563E9] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        stats.progress,
                        0,
                      ),
                      100,
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-medium text-slate-500">
                <span>
                  {
                    stats.completedTasks
                  }{" "}
                  of{" "}
                  {
                    stats.totalTasks
                  }{" "}
                  tasks complete
                </span>

                {(project?.start_date ||
                  project?.end_date) && (
                  <span>
                    {formatDate(
                      project?.start_date,
                    )}{" "}
                    →{" "}
                    {formatDate(
                      project?.end_date,
                    )}
                  </span>
                )}
              </div>
            </section>

            {/* ===================================
                TEAM PERFORMANCE
            ==================================== */}

            <section className="mt-6">
              <h2 className="text-sm font-black uppercase tracking-[0.05em] text-slate-500">
                Team Performance
              </h2>

              <div className="mt-3 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,30,51,0.05)]">
                {teamPerformance.length >
                0 ? (
                  <div className="space-y-5">
                    {teamPerformance.map(
                      (member) => {
                        const user =
                          member?.user;

                        const initials =
                          `${
                            user
                              ?.first_name
                              ?.[0] ||
                            ""
                          }${
                            user
                              ?.last_name
                              ?.[0] ||
                            ""
                          }`.toUpperCase() ||
                          "U";

                        return (
                          <div
                            key={
                              member?.id
                            }
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#536DFE] to-[#795CF8] text-xs font-extrabold text-white">
                                  {
                                    initials
                                  }
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#14223A]">
                                    {
                                      user
                                        ?.first_name
                                    }{" "}
                                    {
                                      user
                                        ?.last_name
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {
                                      member.completed_tasks
                                    }{" "}
                                    of{" "}
                                    {
                                      member.assigned_tasks
                                    }{" "}
                                    tasks
                                    complete
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0 text-sm font-black text-[#14223A]">
                                {
                                  member.progress
                                }
                                %
                              </span>
                            </div>

                            <div className="ml-[52px] mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#3563E9]"
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      member.progress,
                                      0,
                                    ),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-slate-500">
                    No team members
                    available.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ===================================
            BOARD TAB
        ==================================== */}

        {activeTab === "Board" && (
          <Board
            tasks={tasks}
            onOpenTask={
              handleOpenTask
            }
          />
        )}

        {/* ===================================
            TASKS TAB
        ==================================== */}

        {activeTab === "Tasks" && (
          <TasksList
            tasks={tasks}
            onOpenTask={
              handleOpenTask
            }
          />
        )}

        {/* ===================================
            MEMBERS TAB
        ==================================== */}

        {activeTab ===
          "Members" && (
          <MembersList
            members={members}
          />
        )}

        {/* ===================================
            ACTIVITY / SETTINGS
        ==================================== */}

        {(activeTab ===
          "Activity" ||
          activeTab ===
            "Settings") && (
          <div className="mt-7 rounded-[18px] border border-slate-200 bg-white p-7 text-center">
            <h2 className="text-lg font-black text-[#14223A]">
              {activeTab}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {activeTab} content
              will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ===================================
          CREATE TASK MODAL
      ==================================== */}

      <CreateTaskModal
        isOpen={
          isCreateTaskModalOpen
        }
        onClose={() =>
          setIsCreateTaskModalOpen(
            false,
          )
        }
        project={project}
        members={members}
        onCreate={
          handleCreateTask
        }
        isCreating={
          isCreatingTask
        }
      />

      {/* ===================================
          INVITE MEMBER MODAL
      ==================================== */}

      <InviteMemberModal
        isOpen={
          isInviteMemberModalOpen
        }
        onClose={() =>
          setIsInviteMemberModalOpen(
            false,
          )
        }
        onInvite={
          handleInviteMembers
        }
        isInviting={
          isInvitingMembers
        }
      />
    </div>
  );
};

// ==========================================
// MEMBERS TAB
// ==========================================

const MembersList = ({
  members,
}) => {
  const safeMembers =
    Array.isArray(members)
      ? members
      : [];

  return (
    <div className="mt-7 rounded-[18px] border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-black text-[#14223A]">
        Project Members
      </h2>

      <div className="mt-4 space-y-3">
        {safeMembers.length > 0 ? (
          safeMembers.map(
            (member) => {
              const user =
                member?.user;

              const initials =
                `${
                  user?.first_name
                    ?.[0] || ""
                }${
                  user?.last_name
                    ?.[0] || ""
                }`.toUpperCase() ||
                "U";

              return (
                <div
                  key={member?.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#536DFE] text-xs font-bold text-white">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#14223A]">
                        {
                          user
                            ?.first_name
                        }{" "}
                        {
                          user
                            ?.last_name
                        }
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {
                          user
                            ?.email
                        }
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-[#3563E9]">
                    {member?.role}
                  </span>
                </div>
              );
            },
          )
        ) : (
          <p className="py-4 text-sm text-slate-500">
            No members found.
          </p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// TASKS TAB
// ==========================================

const TasksList = ({
  tasks,
  onOpenTask,
}) => {
  const safeTasks =
    Array.isArray(tasks)
      ? tasks
      : [];

  // ==========================================
  // KEYBOARD TASK NAVIGATION
  // ==========================================

  const handleTaskKeyDown = (
    event,
    taskId,
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onOpenTask?.(taskId);
    }
  };

  return (
    <div className="mt-7 rounded-[18px] border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-black text-[#14223A]">
        Project Tasks
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Click a task to view its full
        details.
      </p>

      <div className="mt-4 space-y-3">
        {safeTasks.length > 0 ? (
          safeTasks.map(
            (task) => (
              <div
                key={task?.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  onOpenTask?.(
                    task?.id,
                  )
                }
                onKeyDown={(
                  event,
                ) =>
                  handleTaskKeyDown(
                    event,
                    task?.id,
                  )
                }
                className="
                  cursor-pointer
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-3
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-[#3563E9]/30
                  hover:bg-white
                  hover:shadow-[0_7px_20px_rgba(53,99,233,0.08)]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#3563E9]/10
                "
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#14223A] transition-colors hover:text-[#3563E9]">
                        {task?.title}
                      </p>

                      {/* Open indicator */}

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {task
                        ?.description ||
                        "No description"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                      <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                        {task?.priority ||
                          "MEDIUM"}
                      </span>

                      {task?.due_date && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                          Due{" "}
                          {formatDate(
                            task.due_date,
                          )}
                        </span>
                      )}

                      {task?.assigned_to && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                          {
                            task
                              .assigned_to
                              ?.first_name
                          }{" "}
                          {
                            task
                              .assigned_to
                              ?.last_name
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="h-fit shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">
                    {task?.status}
                  </span>
                </div>
              </div>
            ),
          )
        ) : (
          <p className="py-4 text-sm text-slate-500">
            No tasks created yet.
          </p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// BOARD TAB
// ==========================================

const Board = ({
  tasks,
  onOpenTask,
}) => {
  const safeTasks =
    Array.isArray(tasks)
      ? tasks
      : [];

  const columns = [
    {
      label: "To Do",
      status: "TODO",
    },
    {
      label: "In Progress",
      status:
        "IN_PROGRESS",
    },
    {
      label: "Done",
      status: "DONE",
    },
  ];

  // ==========================================
  // KEYBOARD TASK NAVIGATION
  // ==========================================

  const handleTaskKeyDown = (
    event,
    taskId,
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onOpenTask?.(taskId);
    }
  };

  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-3">
      {columns.map(
        (column) => {
          const columnTasks =
            safeTasks.filter(
              (task) =>
                task?.status ===
                column.status,
            );

          return (
            <div
              key={
                column.status
              }
              className="rounded-[18px] border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#14223A]">
                  {column.label}
                </h3>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                  {
                    columnTasks.length
                  }
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {columnTasks.map(
                  (task) => (
                    <div
                      key={task?.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        onOpenTask?.(
                          task?.id,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) =>
                        handleTaskKeyDown(
                          event,
                          task?.id,
                        )
                      }
                      className="
                        cursor-pointer
                        rounded-xl
                        bg-slate-50
                        p-3
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:bg-white
                        hover:shadow-[0_6px_18px_rgba(53,99,233,0.09)]
                        focus:outline-none
                        focus:ring-4
                        focus:ring-[#3563E9]/10
                      "
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#14223A] transition-colors hover:text-[#3563E9]">
                          {task?.title}
                        </p>

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {task?.priority}
                      </p>

                      {task
                        ?.assigned_to && (
                        <p className="mt-2 text-xs text-slate-500">
                          {
                            task
                              .assigned_to
                              ?.first_name
                          }{" "}
                          {
                            task
                              .assigned_to
                              ?.last_name
                          }
                        </p>
                      )}
                    </div>
                  ),
                )}

                {columnTasks.length ===
                  0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        },
      )}
    </div>
  );
};

// ==========================================
// LOADING CARD
// ==========================================

const LoadingCard = () => {
  return (
    <div className="h-28 rounded-2xl border border-slate-200 bg-white" />
  );
};

// ==========================================
// DATE FORMAT
// ==========================================

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(
      `${date}T00:00:00`,
    );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
};

export default ProjectDetails;