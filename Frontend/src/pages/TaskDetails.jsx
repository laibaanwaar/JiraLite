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

import {
  deleteTask,
  getProjectDetails,
  getProjectMembers,
  getTaskDetails,
  updateTask,
  updateTaskStatus,
} from "../services/projectService";

const TaskDetails = () => {
  const { taskId } = useParams();

  const navigate = useNavigate();

  // ==========================================
  // MAIN DATA
  // ==========================================

  const [task, setTask] =
    useState(null);

  const [project, setProject] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  // ==========================================
  // PAGE STATES
  // ==========================================

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // ACTION STATES
  // ==========================================

  const [
    isEditModalOpen,
    setIsEditModalOpen,
  ] = useState(false);

  const [
    isDeleteModalOpen,
    setIsDeleteModalOpen,
  ] = useState(false);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    isUpdatingStatus,
    setIsUpdatingStatus,
  ] = useState(false);

  // ==========================================
  // LOAD TASK DETAILS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadTaskData = async () => {
      if (!taskId) {
        if (isMounted) {
          setError(
            "Task ID is missing.",
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
          STEP 1
          GET TASK DETAILS
          --------------------------------------

          GET /api/tasks/{taskId}/
        */

        const taskResponse =
          await getTaskDetails(
            taskId,
          );

        if (!isMounted) {
          return;
        }

        const taskData =
          taskResponse?.data;

        if (
          !taskData?.id ||
          !taskData?.project?.id
        ) {
          throw new Error(
            "Task details were not returned correctly.",
          );
        }

        setTask(taskData);

        /*
          --------------------------------------
          STEP 2
          GET PROJECT DETAILS

          Needed because task response
          does NOT contain:

          current_user_role
          --------------------------------------

          GET /api/projects/{projectId}/
        */

        const projectResponse =
          await getProjectDetails(
            taskData.project.id,
          );

        if (!isMounted) {
          return;
        }

        const projectData =
          projectResponse?.data;

        if (!projectData?.id) {
          throw new Error(
            "Project details were not returned correctly.",
          );
        }

        setProject(projectData);

        /*
          --------------------------------------
          STEP 3
          GET MEMBERS ONLY FOR ADMIN

          Admin needs this list for:

          Edit Task
          → Assign To dropdown
          --------------------------------------
        */

        if (
          projectData.current_user_role ===
          "ADMIN"
        ) {
          try {
            const membersResponse =
              await getProjectMembers(
                taskData.project.id,
              );

            if (!isMounted) {
              return;
            }

            const membersData =
              membersResponse?.data
                ?.members;

            setMembers(
              Array.isArray(
                membersData,
              )
                ? membersData
                : [],
            );
          } catch (memberError) {
            console.error(
              "Task project members API failed:",
              memberError,
            );

            if (isMounted) {
              setMembers([]);

              toast.error(
                memberError?.message ||
                  "Unable to load project members.",
              );
            }
          }
        } else {
          setMembers([]);
        }
      } catch (err) {
        console.error(
          "Task details loading failed:",
          err,
        );

        if (!isMounted) {
          return;
        }

        setTask(null);
        setProject(null);
        setMembers([]);

        setError(
          err?.message ||
            "Unable to load task details.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTaskData();

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  // ==========================================
  // ROLE
  // ==========================================

  const isAdmin =
    project?.current_user_role ===
    "ADMIN";

  /*
    Backend GET task permission:

    ADMIN
    → allowed

    Active assignee
    → allowed

    Other users
    → 404

    Therefore a non-admin user who can
    successfully open this page is the
    active assignee according to the
    backend permission rule.
  */

  const canUpdateStatus =
    Boolean(task?.id) &&
    (isAdmin ||
      project?.current_user_role ===
        "MEMBER");

  // ==========================================
  // NEXT VALID STATUS
  // ==========================================
  //
  // Backend workflow example:
  //
  // TODO
  //   ↓
  // IN_PROGRESS
  //   ↓
  // DONE
  //
  // TODO -> DONE may be rejected.
  // ==========================================

  const nextStatus = useMemo(() => {
    if (!task) {
      return null;
    }

    if (task.status === "TODO") {
      return {
        value: "IN_PROGRESS",
        label: "Start task",
      };
    }

    if (
      task.status ===
      "IN_PROGRESS"
    ) {
      return {
        value: "DONE",
        label: "Mark as done",
      };
    }

    return null;
  }, [task]);

  // ==========================================
  // UPDATE TASK DETAILS
  // ADMIN ONLY
  // ==========================================

  const handleUpdateTask = async (
    payload,
  ) => {
    if (!task?.id) {
      toast.error(
        "Task ID is missing.",
      );

      return false;
    }

    if (!isAdmin) {
      toast.error(
        "Only the Project Admin can edit task details.",
      );

      return false;
    }

    try {
      setIsUpdating(true);

      const response =
        await updateTask(
          task.id,
          payload,
        );

      const updatedTask =
        response?.data;

      if (!updatedTask?.id) {
        throw new Error(
          "Task was updated but updated task data was not returned.",
        );
      }

      /*
        Replace task state directly
        with backend source of truth.
      */

      setTask(updatedTask);

      setIsEditModalOpen(false);

      toast.success(
        response?.message ||
          "Task updated successfully.",
      );

      return true;
    } catch (err) {
      console.error(
        "Update task failed:",
        err,
      );

      toast.error(
        err?.message ||
          "Unable to update task.",
      );

      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // ==========================================
  // UPDATE TASK STATUS
  // ADMIN OR ACTIVE ASSIGNEE
  // ==========================================

  const handleStatusUpdate =
    async () => {
      if (
        !task?.id ||
        !nextStatus?.value
      ) {
        return;
      }

      if (!canUpdateStatus) {
        toast.error(
          "You are not allowed to update this task status.",
        );

        return;
      }

      try {
        setIsUpdatingStatus(true);

        const response =
          await updateTaskStatus(
            task.id,
            nextStatus.value,
          );

        const updatedTask =
          response?.data;

        if (!updatedTask?.id) {
          throw new Error(
            "Task status was updated but task data was not returned.",
          );
        }

        /*
          Backend returns the entire
          updated task object.

          Update UI immediately without
          page reload.
        */

        setTask(updatedTask);

        toast.success(
          response?.message ||
            "Task status updated successfully.",
        );
      } catch (err) {
        console.error(
          "Task status update failed:",
          err,
        );

        toast.error(
          err?.message ||
            "Unable to update task status.",
        );
      } finally {
        setIsUpdatingStatus(false);
      }
    };

  // ==========================================
  // DELETE TASK
  // ADMIN ONLY
  // ==========================================

  const handleDeleteTask =
    async () => {
      if (!task?.id) {
        toast.error(
          "Task ID is missing.",
        );

        return false;
      }

      if (!isAdmin) {
        toast.error(
          "Only the Project Admin can delete this task.",
        );

        return false;
      }

      try {
        setIsDeleting(true);

        const projectId =
          task?.project?.id;

        /*
          DELETE /api/tasks/{taskId}/

          Success:
          204 No Content
        */

        await deleteTask(
          task.id,
        );

        toast.success(
          "Task deleted successfully.",
        );

        /*
          Return to its project.

          ProjectDetails fetches task list
          again when the page mounts.
        */

        navigate(
          projectId
            ? `/projects/${projectId}`
            : "/projects",
          {
            replace: true,
          },
        );

        return true;
      } catch (err) {
        console.error(
          "Delete task failed:",
          err,
        );

        toast.error(
          err?.message ||
            "Unable to delete task.",
        );

        return false;
      } finally {
        setIsDeleting(false);
      }
    };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#F7F9FC]">
        <div className="mx-auto max-w-[1050px] px-5 py-7 lg:px-7">

          <div className="animate-pulse">

            <div className="h-5 w-40 rounded bg-slate-200" />

            <div className="mt-8 rounded-[22px] border border-slate-200 bg-white p-6">

              <div className="h-5 w-24 rounded bg-slate-100" />

              <div className="mt-4 h-9 w-80 max-w-full rounded bg-slate-200" />

              <div className="mt-3 h-5 w-[420px] max-w-full rounded bg-slate-100" />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">

                <LoadingBlock />

                <LoadingBlock />

                <LoadingBlock />

                <LoadingBlock />

              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR SCREEN
  // ==========================================

  if (
    error ||
    !task ||
    !project
  ) {
    return (
      <div className="min-h-full bg-[#F7F9FC]">

        <div className="mx-auto max-w-[1050px] px-5 py-7 lg:px-7">

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
              Unable to load task
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-600">
              {error ||
                "Task not found or you do not have access to it."}
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

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F7F9FC]">

      <main className="mx-auto w-full max-w-[1050px] px-5 py-6 lg:px-7">

        {/* =====================================
            BACK TO PROJECT
        ====================================== */}

        <Link
          to={`/projects/${task.project.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#3563E9]"
        >
          <span className="text-xl">
            ‹
          </span>

          Back to project
        </Link>

        {/* =====================================
            TASK HEADER
        ====================================== */}

        <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_8px_26px_rgba(15,30,51,0.06)] sm:p-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            {/* LEFT */}

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase text-slate-500">
                  {task?.project
                    ?.project_key ||
                    "PRJ"}
                </span>

                <TaskPriorityBadge
                  priority={
                    task?.priority
                  }
                />

                <TaskStatusBadge
                  status={
                    task?.status
                  }
                />

                {project
                  ?.current_user_role && (
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-[#3563E9]">
                    {
                      project.current_user_role
                    }
                  </span>
                )}

              </div>

              <h1 className="mt-4 break-words text-3xl font-black tracking-[-0.7px] text-[#14223A]">
                {task?.title ||
                  "Untitled Task"}
              </h1>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/projects/${task.project.id}`,
                  )
                }
                className="mt-2 text-left text-sm font-bold text-[#3563E9] hover:underline"
              >
                {task?.project?.name ||
                  "Project"}
              </button>

            </div>

            {/* ADMIN ACTIONS */}

            {isAdmin && (
              <div className="flex shrink-0 flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setIsEditModalOpen(
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
                    transition
                    hover:bg-blue-50
                  "
                >
                  <EditIcon />

                  Edit task
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setIsDeleteModalOpen(
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
                    border-red-200
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-extrabold
                    text-red-600
                    transition
                    hover:bg-red-50
                  "
                >
                  <DeleteIcon />

                  Delete task
                </button>

              </div>
            )}

          </div>

          {/* =====================================
              DESCRIPTION
          ====================================== */}

          <div className="mt-7 border-t border-slate-100 pt-6">

            <p className="text-xs font-black uppercase tracking-[0.06em] text-slate-400">
              Description
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {task?.description ||
                "No description provided for this task."}
            </p>

          </div>

        </section>

        {/* =====================================
            TASK INFORMATION
        ====================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2">

          <InfoCard
            label="Status"
          >
            <TaskStatusBadge
              status={task.status}
            />
          </InfoCard>

          <InfoCard
            label="Priority"
          >
            <TaskPriorityBadge
              priority={
                task.priority
              }
            />
          </InfoCard>

          <InfoCard
            label="Assigned to"
          >
            <UserInfo
              user={
                task.assigned_to
              }
              fallback="Unassigned"
            />
          </InfoCard>

          <InfoCard
            label="Due date"
          >
            <p className="text-sm font-bold text-[#14223A]">
              {formatDate(
                task.due_date,
              )}
            </p>
          </InfoCard>

          <InfoCard
            label="Created by"
          >
            <UserInfo
              user={
                task.created_by
              }
              fallback="Unknown"
            />
          </InfoCard>

          <InfoCard
            label="Completed at"
          >
            <p className="text-sm font-bold text-[#14223A]">
              {formatDateTime(
                task.completed_at,
              )}
            </p>
          </InfoCard>

        </section>

        {/* =====================================
            STATUS WORKFLOW
        ====================================== */}

        {canUpdateStatus && (
          <section className="mt-6 rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_5px_18px_rgba(15,30,51,0.05)]">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-lg font-black text-[#14223A]">
                  Task status
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isAdmin
                    ? "Update this task through its workflow."
                    : "Update the status of your assigned task as you make progress."}
                </p>

              </div>

              <TaskStatusBadge
                status={task.status}
              />

            </div>

            {/* WORKFLOW */}

            <div className="mt-6">

              <div className="grid grid-cols-3 gap-2">

                <StatusStep
                  label="To Do"
                  active={
                    task.status ===
                    "TODO"
                  }
                  completed={
                    task.status ===
                      "IN_PROGRESS" ||
                    task.status ===
                      "DONE"
                  }
                />

                <StatusStep
                  label="In Progress"
                  active={
                    task.status ===
                    "IN_PROGRESS"
                  }
                  completed={
                    task.status ===
                    "DONE"
                  }
                />

                <StatusStep
                  label="Done"
                  active={
                    task.status ===
                    "DONE"
                  }
                  completed={false}
                />

              </div>

              {nextStatus ? (
                <button
                  type="button"
                  onClick={
                    handleStatusUpdate
                  }
                  disabled={
                    isUpdatingStatus
                  }
                  className="
                    mt-6
                    inline-flex
                    w-full
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#3563E9]
                    px-5
                    py-3.5
                    font-extrabold
                    text-white
                    shadow-[0_8px_22px_rgba(53,99,233,0.24)]
                    transition
                    hover:bg-[#2F58D3]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:w-auto
                  "
                >
                  {isUpdatingStatus
                    ? "Updating..."
                    : nextStatus.label}
                </button>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  This task has been
                  completed.
                </div>
              )}

            </div>

          </section>
        )}

        {/* =====================================
            ACTIVITY INFORMATION
        ====================================== */}

        <section className="mt-6 rounded-[20px] border border-slate-200 bg-white p-6">

          <h2 className="text-lg font-black text-[#14223A]">
            Task information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">

            <DateInfo
              label="Created"
              value={formatDateTime(
                task.created_at,
              )}
            />

            <DateInfo
              label="Last updated"
              value={formatDateTime(
                task.updated_at,
              )}
            />

            <DateInfo
              label="Completed"
              value={formatDateTime(
                task.completed_at,
              )}
            />

          </div>

        </section>

      </main>

      {/* =====================================
          EDIT TASK MODAL
          ADMIN ONLY
      ====================================== */}

      <EditTaskModal
        isOpen={
          isEditModalOpen
        }
        task={task}
        members={members}
        isUpdating={
          isUpdating
        }
        onClose={() =>
          setIsEditModalOpen(
            false,
          )
        }
        onUpdate={
          handleUpdateTask
        }
      />

      {/* =====================================
          DELETE TASK MODAL
          ADMIN ONLY
      ====================================== */}

      <DeleteTaskModal
        isOpen={
          isDeleteModalOpen
        }
        task={task}
        isDeleting={
          isDeleting
        }
        onClose={() =>
          setIsDeleteModalOpen(
            false,
          )
        }
        onDelete={
          handleDeleteTask
        }
      />

    </div>
  );
};

// ==========================================================
// INFO CARD
// ==========================================================

const InfoCard = ({
  label,
  children,
}) => {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_4px_14px_rgba(15,30,51,0.04)]">

      <p className="text-xs font-black uppercase tracking-[0.05em] text-slate-400">
        {label}
      </p>

      <div className="mt-3">
        {children}
      </div>

    </div>
  );
};

// ==========================================================
// USER INFO
// ==========================================================

const UserInfo = ({
  user,
  fallback,
}) => {
  if (!user) {
    return (
      <p className="text-sm font-bold text-slate-500">
        {fallback}
      </p>
    );
  }

  const initials =
    `${
      user?.first_name?.[0] ||
      ""
    }${
      user?.last_name?.[0] ||
      ""
    }`.toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#536DFE] to-[#795CF8] text-xs font-black text-white">
        {initials}
      </div>

      <div className="min-w-0">

        <p className="truncate text-sm font-bold text-[#14223A]">
          {user?.first_name}{" "}
          {user?.last_name}
        </p>

        {user?.email && (
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {user.email}
          </p>
        )}

      </div>

    </div>
  );
};

// ==========================================================
// STATUS BADGE
// ==========================================================

const TaskStatusBadge = ({
  status,
}) => {
  const styles = {
    TODO:
      "border-slate-200 bg-slate-100 text-slate-600",

    IN_PROGRESS:
      "border-blue-200 bg-blue-50 text-blue-700",

    DONE:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  const labels = {
    TODO: "TO DO",

    IN_PROGRESS:
      "IN PROGRESS",

    DONE: "DONE",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-extrabold
        ${
          styles[status] ||
          styles.TODO
        }
      `}
    >
      {labels[status] ||
        status ||
        "TO DO"}
    </span>
  );
};

// ==========================================================
// PRIORITY BADGE
// ==========================================================

const TaskPriorityBadge = ({
  priority,
}) => {
  const styles = {
    HIGH:
      "border-red-200 bg-red-50 text-red-600",

    MEDIUM:
      "border-amber-200 bg-amber-50 text-amber-700",

    LOW:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-extrabold
        ${
          styles[priority] ||
          styles.MEDIUM
        }
      `}
    >
      {priority || "MEDIUM"}
    </span>
  );
};

// ==========================================================
// STATUS WORKFLOW STEP
// ==========================================================

const StatusStep = ({
  label,
  active,
  completed,
}) => {
  return (
    <div
      className={`
        rounded-xl
        border
        px-3
        py-3
        text-center
        text-xs
        font-extrabold
        ${
          active
            ? "border-[#3563E9] bg-blue-50 text-[#3563E9]"
            : completed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-400"
        }
      `}
    >
      {completed
        ? "✓ "
        : ""}

      {label}
    </div>
  );
};

// ==========================================================
// DATE INFO
// ==========================================================

const DateInfo = ({
  label,
  value,
}) => {
  return (
    <div>

      <p className="text-xs font-bold uppercase tracking-[0.05em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-[#14223A]">
        {value}
      </p>

    </div>
  );
};

// ==========================================================
// EDIT TASK MODAL
// ADMIN ONLY
// ==========================================================

const EditTaskModal = ({
  isOpen,
  task,
  members,
  isUpdating,
  onClose,
  onUpdate,
}) => {
  const [
    formData,
    setFormData,
  ] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "MEDIUM",
    due_date: "",
  });

  const [
    validationError,
    setValidationError,
  ] = useState("");

  // ==========================================
  // LOAD EXISTING TASK VALUES
  // ==========================================

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }

    setFormData({
      title:
        task?.title || "",

      description:
        task?.description || "",

      assigned_to:
        task?.assigned_to?.id
          ? String(
              task.assigned_to.id,
            )
          : "",

      priority:
        task?.priority ||
        "MEDIUM",

      due_date:
        task?.due_date || "",
    });

    setValidationError("");
  }, [
    isOpen,
    task,
  ]);

  // ==========================================
  // ESCAPE + SCROLL LOCK
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !isUpdating
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    isOpen,
    isUpdating,
    onClose,
  ]);

  if (!isOpen || !task) {
    return null;
  }

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    );

    setValidationError("");
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setValidationError("");

    const title =
      formData.title.trim();

    if (!title) {
      setValidationError(
        "Task title is required.",
      );

      return;
    }

    const assignedTo =
      Number(
        formData.assigned_to,
      );

    if (
      !Number.isInteger(
        assignedTo,
      ) ||
      assignedTo <= 0
    ) {
      setValidationError(
        "Please select a valid assignee.",
      );

      return;
    }

    /*
      Status is intentionally NOT sent.

      Backend uses separate endpoint:

      PATCH /api/tasks/{id}/status/
    */

    const payload = {
      title,

      description:
        formData.description.trim(),

      assigned_to:
        assignedTo,

      priority:
        formData.priority,

      due_date:
        formData.due_date ||
        null,
    };

    await onUpdate(payload);
  };

  const safeMembers =
    Array.isArray(members)
      ? members.filter(
          (member) =>
            member?.status ===
              "ACTIVE" ||
            !member?.status,
        )
      : [];

  return (
    <div className="fixed inset-0 z-[250] overflow-y-auto bg-[#0F1E33]/55 px-4 py-6 backdrop-blur-[2px]">

      <div className="flex min-h-full items-center justify-center">

        <div className="relative w-full max-w-[650px] rounded-[22px] bg-white p-6 shadow-[0_30px_90px_rgba(15,30,51,0.28)] sm:p-8">

          <button
            type="button"
            onClick={onClose}
            disabled={
              isUpdating
            }
            className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            ×
          </button>

          <h2 className="pr-10 text-2xl font-black text-[#14223A]">
            Edit task
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the task details.
            Status is managed separately.
          </p>

          {validationError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {validationError}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6 space-y-5"
          >

            {/* TITLE */}

            <FormField
              label="Task title *"
            >
              <input
                type="text"
                name="title"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                disabled={
                  isUpdating
                }
                className={inputClass}
              />
            </FormField>

            {/* DESCRIPTION */}

            <FormField
              label="Description"
            >
              <textarea
                name="description"
                rows={4}
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                disabled={
                  isUpdating
                }
                className={`${inputClass} resize-none`}
              />
            </FormField>

            {/* ASSIGNEE */}

            <FormField
              label="Assign to *"
            >
              <select
                name="assigned_to"
                value={
                  formData.assigned_to
                }
                onChange={
                  handleChange
                }
                disabled={
                  isUpdating
                }
                className={inputClass}
              >

                <option value="">
                  Select member
                </option>

                {safeMembers.map(
                  (member) => (
                    <option
                      key={
                        member.id
                      }
                      value={
                        member?.user
                          ?.id
                      }
                    >
                      {
                        member?.user
                          ?.first_name
                      }{" "}
                      {
                        member?.user
                          ?.last_name
                      }{" "}
                      (
                      {
                        member?.user
                          ?.email
                      }
                      )
                    </option>
                  ),
                )}

              </select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* PRIORITY */}

              <FormField
                label="Priority"
              >
                <select
                  name="priority"
                  value={
                    formData.priority
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isUpdating
                  }
                  className={
                    inputClass
                  }
                >

                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                </select>
              </FormField>

              {/* DUE DATE */}

              <FormField
                label="Due date"
              >
                <input
                  type="date"
                  name="due_date"
                  value={
                    formData.due_date
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isUpdating
                  }
                  className={
                    inputClass
                  }
                />
              </FormField>

            </div>

            {/* BUTTONS */}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={onClose}
                disabled={
                  isUpdating
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-[#14223A] hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isUpdating
                }
                className="rounded-xl bg-[#3563E9] px-6 py-3 font-extrabold text-white shadow-[0_8px_20px_rgba(53,99,233,0.22)] hover:bg-[#2F58D3] disabled:opacity-60"
              >
                {isUpdating
                  ? "Saving..."
                  : "Save changes"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

// ==========================================================
// DELETE TASK MODAL
// ==========================================================

const DeleteTaskModal = ({
  isOpen,
  task,
  isDeleting,
  onClose,
  onDelete,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !isDeleting
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    isOpen,
    isDeleting,
    onClose,
  ]);

  if (!isOpen || !task) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#0F1E33]/55 px-4 py-6 backdrop-blur-[2px]">

      <div className="relative w-full max-w-[500px] rounded-[22px] bg-white p-6 shadow-[0_30px_90px_rgba(15,30,51,0.28)] sm:p-8">

        <button
          type="button"
          onClick={onClose}
          disabled={
            isDeleting
          }
          className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        >
          ×
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <DeleteIcon />
        </div>

        <h2 className="mt-5 text-2xl font-black text-[#14223A]">
          Delete task?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Are you sure you want to
          delete{" "}
          <span className="font-extrabold text-[#14223A]">
            "
            {task.title}
            "
          </span>
          ?
        </p>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm font-bold text-red-700">
            This action cannot be
            undone.
          </p>

          <p className="mt-1 text-xs leading-5 text-red-600">
            The task will be removed
            from this project.
          </p>

        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            disabled={
              isDeleting
            }
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-[#14223A] hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={
              isDeleting
            }
            className="rounded-xl bg-red-600 px-5 py-3 font-extrabold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting
              ? "Deleting..."
              : "Delete task"}
          </button>

        </div>

      </div>

    </div>
  );
};

// ==========================================================
// FORM FIELD
// ==========================================================

const FormField = ({
  label,
  children,
}) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#14223A]">
        {label}
      </label>

      {children}

    </div>
  );
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-[#14223A] outline-none transition focus:border-[#3563E9] focus:bg-white focus:ring-4 focus:ring-[#3563E9]/10 disabled:cursor-not-allowed disabled:opacity-60";

// ==========================================================
// ICONS
// ==========================================================

const EditIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />

    </svg>
  );
};

const DeleteIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M3 6h18" />

      <path d="M8 6V4h8v2" />

      <path d="M19 6l-1 14H6L5 6" />

      <path d="M10 11v5" />

      <path d="M14 11v5" />

    </svg>
  );
};

// ==========================================================
// LOADING BLOCK
// ==========================================================

const LoadingBlock = () => {
  return (
    <div className="h-24 rounded-xl bg-slate-100" />
  );
};

// ==========================================================
// DATE FORMAT
// ==========================================================

const formatDate = (value) => {
  if (!value) {
    return "No due date";
  }

  const parsedDate =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return value;
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

// ==========================================================
// DATE + TIME FORMAT
// ==========================================================

const formatDateTime = (
  value,
) => {
  if (!value) {
    return "—";
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return value;
  }

  return parsedDate.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
};

export default TaskDetails;