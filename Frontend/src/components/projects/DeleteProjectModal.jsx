import {
  useEffect,
} from "react";

const DeleteProjectModal = ({
  isOpen,
  project,
  onClose,
  onDelete,
  isDeleting = false,
}) => {
  // ==========================================
  // ESCAPE KEY + BODY SCROLL
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

  if (!isOpen || !project) {
    return null;
  }

  // ==========================================
  // CLOSE
  // ==========================================

  const handleClose = () => {
    if (isDeleting) {
      return;
    }

    onClose();
  };

  // ==========================================
  // CONFIRM DELETE
  // ==========================================

  const handleDelete = async () => {
    if (
      typeof onDelete !==
      "function"
    ) {
      return;
    }

    await onDelete();
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        flex
        items-center
        justify-center
        bg-[#0F1E33]/55
        px-4
        py-6
        backdrop-blur-[2px]
      "
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
      >

        {/* CLOSE */}

        <button
          type="button"
          onClick={
            handleClose
          }
          disabled={
            isDeleting
          }
          aria-label="Close delete project modal"
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
            hover:text-[#14223A]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          ×
        </button>

        {/* DELETE ICON */}

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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path d="M3 6h18" />

            <path d="M8 6V4h8v2" />

            <path d="M19 6l-1 14H6L5 6" />

            <path d="M10 11v5" />

            <path d="M14 11v5" />
          </svg>
        </div>

        {/* HEADER */}

        <h2 className="mt-5 text-2xl font-black text-[#14223A]">
          Delete project?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Are you sure you want to
          delete{" "}
          <span className="font-extrabold text-[#14223A]">
            "
            {project?.name ||
              "this project"}
            "
          </span>
          ?
        </p>

        {/* WARNING */}

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm font-bold text-red-700">
            This action cannot be
            undone.
          </p>

          <p className="mt-1 text-xs leading-5 text-red-600">
            Project data and related
            information may be
            permanently removed.
          </p>

        </div>

        {/* PROJECT INFO */}

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">

              <p className="truncate text-sm font-extrabold text-[#14223A]">
                {project?.name ||
                  "Untitled Project"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Project key:{" "}
                <span className="font-bold">
                  {project?.project_key ||
                    "PRJ"}
                </span>
              </p>

            </div>

            <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold text-[#3563E9]">
              {project?.current_user_role ||
                "ADMIN"}
            </span>

          </div>

        </div>

        {/* BUTTONS */}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={
              handleClose
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
              rounded-xl
              bg-red-600
              px-5
              py-3
              font-extrabold
              text-white
              shadow-[0_8px_20px_rgba(220,38,38,0.22)]
              transition
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {isDeleting
              ? "Deleting..."
              : "Delete project"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default DeleteProjectModal;