import {
  useEffect,
  useMemo,
  useState,
} from "react";

const INITIAL_FORM = {
  title: "",
  description: "",
  assigned_to: "",
  priority: "MEDIUM",
  due_date: "",
};

const CreateTaskModal = ({
  isOpen,
  onClose,
  project,
  members = [],
  onCreate,
  isCreating = false,
}) => {
  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [validationError, setValidationError] =
    useState("");

  // ==========================================
  // ACTIVE PROJECT MEMBERS
  // ==========================================

  const activeMembers = useMemo(() => {
    if (!Array.isArray(members)) {
      return [];
    }

    return members.filter(
      (member) =>
        member?.status === "ACTIVE" &&
        member?.user?.id,
    );
  }, [members]);

  // ==========================================
  // RESET MODAL WHEN OPENED
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(INITIAL_FORM);
    setValidationError("");
  }, [isOpen]);

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

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !isCreating
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
  }, [isOpen, isCreating, onClose]);

  if (!isOpen) {
    return null;
  }

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationError("");
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    setFormData(INITIAL_FORM);
    setValidationError("");
    onClose();
  };

  // ==========================================
  // SUBMIT TASK
  // ==========================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setValidationError("");

    if (!formData.title.trim()) {
      setValidationError(
        "Task title is required.",
      );

      return;
    }

    if (!formData.assigned_to) {
      setValidationError(
        "Please select a project member.",
      );

      return;
    }

    if (typeof onCreate !== "function") {
      setValidationError(
        "Create task handler is not available.",
      );

      return;
    }

    const wasCreated =
      await onCreate({
        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        assigned_to:
          Number(
            formData.assigned_to,
          ),

        priority:
          formData.priority,

        due_date:
          formData.due_date,
      });

    if (wasCreated) {
      setFormData(INITIAL_FORM);
      setValidationError("");
      onClose();
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        overflow-y-auto
        bg-[#0F1E33]/55
        px-4
        py-5
        backdrop-blur-[2px]
      "
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="
            relative
            max-h-[calc(100vh-40px)]
            w-full
            max-w-[650px]
            overflow-y-auto
            rounded-[22px]
            bg-white
            p-6
            shadow-[0_30px_90px_rgba(15,30,51,0.28)]
            sm:p-7
          "
        >
          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            aria-label="Close create task modal"
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

          {/* HEADER */}

          <div className="pr-10">
            <h2 className="text-2xl font-black text-[#14223A]">
              Create task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new task to this
              project.
            </p>
          </div>

          {/* VALIDATION ERROR */}

          {validationError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {validationError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            {/* PROJECT */}

            <div>
              <label className="mb-2 block text-sm font-bold text-[#14223A]">
                Project
              </label>

              <div className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3.5 text-base font-semibold text-[#14223A]">
                {project?.name ||
                  "Current project"}
              </div>
            </div>

            {/* TASK TITLE */}

            <div>
              <label
                htmlFor="task-title"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Task title *
              </label>

              <input
                id="task-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isCreating}
                placeholder="e.g. Build Login UI"
                autoFocus
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3.5
                  text-base
                  text-[#14223A]
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-[#3563E9]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#3563E9]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label
                htmlFor="task-description"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Description
              </label>

              <textarea
                id="task-description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                disabled={isCreating}
                placeholder="Add more context..."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3.5
                  text-base
                  text-[#14223A]
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-[#3563E9]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#3563E9]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>

            {/* ASSIGN TO + PRIORITY */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="assigned_to"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  Assign to *
                </label>

                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={
                    formData.assigned_to
                  }
                  onChange={handleChange}
                  disabled={isCreating}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    px-4
                    py-3.5
                    text-[#14223A]
                    outline-none
                    focus:border-[#3563E9]
                    focus:ring-4
                    focus:ring-[#3563E9]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <option value="">
                    Select member
                  </option>

                  {activeMembers.map(
                    (member) => {
                      const user =
                        member.user;

                      const fullName =
                        `${user?.first_name || ""} ${
                          user?.last_name || ""
                        }`.trim();

                      return (
                        <option
                          key={member.id}
                          value={user.id}
                        >
                          {fullName ||
                            user.email}
                        </option>
                      );
                    },
                  )}
                </select>

                {activeMembers.length ===
                  0 && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    No active project
                    members are available.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="task-priority"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  Priority
                </label>

                <select
                  id="task-priority"
                  name="priority"
                  value={
                    formData.priority
                  }
                  onChange={handleChange}
                  disabled={isCreating}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    px-4
                    py-3.5
                    text-[#14223A]
                    outline-none
                    focus:border-[#3563E9]
                    focus:ring-4
                    focus:ring-[#3563E9]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
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
              </div>
            </div>

            {/* STATUS + DUE DATE */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#14223A]">
                  Status
                </label>

                <div className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3.5 text-[#14223A]">
                  To Do
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  New tasks automatically
                  start as To Do.
                </p>
              </div>

              <div>
                <label
                  htmlFor="task-due-date"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  Due date
                </label>

                <input
                  id="task-due-date"
                  type="date"
                  name="due_date"
                  value={
                    formData.due_date
                  }
                  onChange={handleChange}
                  disabled={isCreating}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    px-4
                    py-3.5
                    text-[#14223A]
                    outline-none
                    focus:border-[#3563E9]
                    focus:ring-4
                    focus:ring-[#3563E9]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={
                  isCreating ||
                  activeMembers.length ===
                    0
                }
                className="
                  w-full
                  rounded-xl
                  bg-[#3563E9]
                  py-3.5
                  font-extrabold
                  text-white
                  shadow-[0_8px_22px_rgba(53,99,233,0.25)]
                  transition
                  hover:bg-[#2F58D3]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isCreating
                  ? "Creating task..."
                  : "Create task"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  py-3.5
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;