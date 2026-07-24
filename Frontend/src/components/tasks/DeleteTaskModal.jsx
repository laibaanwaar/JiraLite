import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router";

import { toast } from "react-toastify";

import {
  deleteTask,
} from "../../services/projectService";

const DeleteTaskModal = ({
  isOpen,
  task,
  onClose,
  onDeleted,
}) => {
  const navigate = useNavigate();

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  // ==========================================
  // BODY SCROLL LOCK + ESCAPE KEY
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
        event.key === "Escape" &&
        !isDeleting
      ) {
        onClose?.();
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

  // ==========================================
  // DELETE TASK
  //
  // DELETE /api/tasks/{taskId}/
  //
  // Success:
  // 204 No Content
  //
  // Only Project Admin can delete.
  // ==========================================

  const handleDelete = async () => {
    if (!task?.id) {
      toast.error(
        "Task ID is missing.",
      );

      return;
    }

    try {
      setIsDeleting(true);

      const taskId =
        task.id;

      const projectId =
        task?.project?.id;

      /*
        Backend returns:

        HTTP 204 No Content

        Therefore we do NOT expect:

        response.data
        response.message
      */

      await deleteTask(taskId);

      /*
        Optional callback.

        Parent page can use this callback
        to update local state before
        navigation if needed.
      */

      onDeleted?.(taskId);

      toast.success(
        "Task deleted successfully.",
      );

      onClose?.();

      /*
        Navigate back to project details.

        ProjectDetails.jsx will fetch
        the latest task list deleted successfully.",
      );

      onClose?.();

      /*
        Navigate back to project details.

 again,
        therefore deleted task will no
        longer appear in:

        - Overview statistics
        - Board
        - Tasks tab
        - Team progress
      */

      if (projectId) {
        navigate(
          `/projects/${projectId}`,
          {
            replace: true,
          },
        );

        return;
      }

      navigate(
        "/projects",
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "Delete task failed:",
        error,
      );

      toast.error(
        error?.message ||
          "Unable to delete task.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // BACKDROP CLICK
  // ==========================================

  const handleBackdropClick = (
    event,
  ) => {
    if (
      event.target ===
        event.currentTarget &&
      !isDeleting
    ) {
      onClose?.();
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[300]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-[#0F1E33]/55
        px-4
        py-6
        backdrop-blur-[2px]
      "
      onMouseDown={
        handleBackdropClick
      }
    >
      <div
        className="
          relative
          w-full
          max-w-[500px]
          rounded-[22px]
          bg-white
          p-6
          shadow-[0_30px_90px_rgba(15,30,51,0.28)]
          sm:p-8
        "
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        {/* ===================================
            CLOSE BUTTON
        ==================================== */}

        <button
          type="button"
          onClick={() =>
            onClose?.()
          }
          disabled={
            isDeleting
          }
          className="
            absolute
            right-5
            top-4
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-2xl
            text-slate-500
            transition
            hover:bg-slate-100
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          aria-label="Close delete task modal"
        >
          ×
        </button>

        {/* ===================================
            DELETE ICON
        ==================================== */}

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-red-50
            text-red-600
          "
        >
          <DeleteIcon />
        </div>

        {/* ===================================
            TITLE
        ==================================== */}

        <h2 className="mt-5 pr-10 text-2xl font-black text-[#14223A]">
          Delete task?
        </h2>

        {/* ===================================
            DESCRIPTION
        ==================================== */}

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Are you sure you want to
          delete{" "}
          <span className="font-extrabold text-[#14223A]">
            "{task?.title ||
              "this task"}"
          </span>
          ?
        </p>

        {/* ===================================
            TASK INFO
        ==================================== */}

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {task?.project
              ?.project_key && (
              <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase text-slate-500">
                {
                  task.project
                    .project_key
                }
              </span>
            )}

            {task?.status && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {formatStatus(
                  task.status,
                )}
              </span>
            )}
          </div>

          {task?.project?.name && (
            <p className="mt-2 text-sm font-bold text-[#14223A]">
              {task.project.name}
            </p>
          )}
        </div>

        {/* ===================================
            WARNING
        ==================================== */}

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-bold text-red-700">
                This action cannot be
                undone.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                The task will be deleted
                from this project and
                removed from project task
                statistics.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================
            ACTION BUTTONS
        ==================================== */}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              onClose?.()
            }
            disabled={
              isDeleting
            }
            className="
              rounded-xl
              border
              border-slate-300
              bg-white
              px-5
              py-3
              text-sm
              font-bold
              text-[#14223A]
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={
              isDeleting
            }
            className="
              inline-flex
              min-w-[145px]
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-red-600
              px-5
              py-3
              text-sm
              font-extrabold
              text-white
              shadow-[0_8px_20px_rgba(220,38,38,0.20)]
              transition
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {isDeleting ? (
              <>
                <LoadingSpinner />

                Deleting...
              </>
            ) : (
              <>
                <DeleteIconSmall />

                Delete task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DELETE ICON
// ==========================================

const DeleteIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-7 w-7"
    >
      <path d="M3 6h18" />

      <path d="M8 6V4h8v2" />

      <path d="M19 6l-1 14H6L5 6" />

      <path d="M10 11v5" />

      <path d="M14 11v5" />
    </svg>
  );
};

// ==========================================
// SMALL DELETE ICON
// ==========================================

const DeleteIconSmall = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M3 6h18" />

      <path d="M8 6V4h8v2" />

      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
};

// ==========================================
// LOADING SPINNER
// ==========================================

const LoadingSpinner = () => {
  return (
    <span
      className="
        h-4
        w-4
        animate-spin
        rounded-full
        border-2
        border-white/40
        border-t-white
      "
    />
  );
};

// ==========================================
// FORMAT STATUS
// ==========================================

const formatStatus = (
  status,
) => {
  switch (status) {
    case "TODO":
      return "To Do";

    case "IN_PROGRESS":
      return "In Progress";

    case "DONE":
      return "Done";

    default:
      return (
        status || "Unknown"
      );
  }
};

export default DeleteTaskModal;