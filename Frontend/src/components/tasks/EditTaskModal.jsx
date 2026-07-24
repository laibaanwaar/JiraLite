import {
  useEffect,
  useMemo,
  useState,
} from "react";

const EditTaskModal = ({
  isOpen,
  task,
  members,
  isUpdating = false,
  onClose,
  onUpdate,
}) => {
  // ==========================================
  // FORM STATE
  // ==========================================

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
    initialFormData,
    setInitialFormData,
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

    const existingValues = {
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
    };

    setFormData(
      existingValues,
    );

    setInitialFormData(
      existingValues,
    );

    setValidationError("");
  }, [
    isOpen,
    task,
  ]);

  // ==========================================
  // ACTIVE PROJECT MEMBERS
  // ==========================================
  //
  // Members API commonly returns:
  //
  // {
  //   id: ProjectMember ID,
  //   user: {
  //     id: User ID,
  //     first_name,
  //     last_name,
  //     email
  //   },
  //   role,
  //   status
  // }
  //
  // IMPORTANT:
  //
  // assigned_to must send USER ID:
  //
  // member.user.id
  //
  // NOT:
  //
  // member.id
  // ==========================================

  const safeMembers = useMemo(() => {
    if (!Array.isArray(members)) {
      return [];
    }

    return members.filter(
      (member) => {
        /*
          Keep active members.

          Some serializers may not
          include status at all, so
          those members remain valid.
        */

        return (
          !member?.status ||
          member.status ===
            "ACTIVE"
        );
      },
    );
  }, [members]);

  // ==========================================
  // LOCK BODY SCROLL + ESCAPE
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
    isUpdating,
    onClose,
  ]);

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
  // CHECK CHANGED FIELDS
  // ==========================================
  //
  // PATCH should only send fields
  // that actually changed.
  //
  // Backend error for empty PATCH:
  //
  // {
  //   "detail":
  //   "At least one editable field must be provided."
  // }
  // ==========================================

  const buildChangedPayload =
    () => {
      const payload = {};

      const title =
        formData.title.trim();

      const description =
        formData.description.trim();

      const assignedTo =
        formData.assigned_to;

      const priority =
        formData.priority;

      const dueDate =
        formData.due_date;

      if (
        title !==
        initialFormData.title.trim()
      ) {
        payload.title = title;
      }

      if (
        description !==
        initialFormData.description.trim()
      ) {
        payload.description =
          description;
      }

      if (
        String(assignedTo) !==
        String(
          initialFormData.assigned_to,
        )
      ) {
        payload.assigned_to =
          Number(assignedTo);
      }

      if (
        priority !==
        initialFormData.priority
      ) {
        payload.priority =
          priority;
      }

      if (
        dueDate !==
        initialFormData.due_date
      ) {
        payload.due_date =
          dueDate || null;
      }

      return payload;
    };

  // ==========================================
  // SUBMIT UPDATE
  // ==========================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setValidationError("");

    // ------------------------------------------
    // TITLE VALIDATION
    // ------------------------------------------

    const title =
      formData.title.trim();

    if (!title) {
      setValidationError(
        "Task title is required.",
      );

      return;
    }

    // ------------------------------------------
    // ASSIGNEE VALIDATION
    // ------------------------------------------

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
        "Please select a valid project member.",
      );

      return;
    }

    // ------------------------------------------
    // PRIORITY VALIDATION
    // ------------------------------------------

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
    ];

    if (
      !allowedPriorities.includes(
        formData.priority,
      )
    ) {
      setValidationError(
        "Please select a valid priority.",
      );

      return;
    }

    // ------------------------------------------
    // BUILD PARTIAL PATCH
    // ------------------------------------------

    const payload =
      buildChangedPayload();

    if (
      Object.keys(payload).length ===
      0
    ) {
      setValidationError(
        "No changes were made to the task.",
      );

      return;
    }

    /*
      Do NOT include:

      status

      Status has separate workflow:

      PATCH /api/tasks/{taskId}/status/
    */

    const success =
      await onUpdate?.(
        payload,
      );

    /*
      Parent TaskDetails.jsx normally
      closes the modal after successful
      update.

      Keeping this fallback makes the
      modal reusable.
    */

    if (success === true) {
      setValidationError("");
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
      !isUpdating
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
        z-[250]
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
      <div className="flex min-h-full items-center justify-center">
        <div
          className="
            relative
            w-full
            max-w-[650px]
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
              isUpdating
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
            aria-label="Close edit task modal"
          >
            ×
          </button>

          {/* ===================================
              HEADER
          ==================================== */}

          <div className="pr-10">
            <h2 className="text-2xl font-black text-[#14223A]">
              Edit task
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Update the task details.
              Task status is managed
              separately through the
              task workflow.
            </p>
          </div>

          {/* ===================================
              TASK / PROJECT INFO
          ==================================== */}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {task?.project
              ?.project_key && (
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase text-slate-500">
                {
                  task.project
                    .project_key
                }
              </span>
            )}

            {task?.project?.name && (
              <span className="text-sm font-bold text-slate-500">
                {
                  task.project.name
                }
              </span>
            )}
          </div>

          {/* ===================================
              VALIDATION ERROR
          ==================================== */}

          {validationError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-600">
                {
                  validationError
                }
              </p>
            </div>
          )}

          {/* ===================================
              FORM
          ==================================== */}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6 space-y-5"
          >
            {/* =================================
                TITLE
            ================================== */}

            <FormField
              label="Task title"
              required
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
                placeholder="Enter task title"
                autoComplete="off"
                className={
                  inputClass
                }
              />
            </FormField>

            {/* =================================
                DESCRIPTION
            ================================== */}

            <FormField label="Description">
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
                placeholder="Enter task description"
                className={`${inputClass} resize-none`}
              />
            </FormField>

            {/* =================================
                ASSIGNEE
            ================================== */}

            <FormField
              label="Assign to"
              required
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
                className={
                  inputClass
                }
              >
                <option value="">
                  Select project member
                </option>

                {safeMembers.map(
                  (
                    member,
                    index,
                  ) => {
                    const user =
                      member?.user;

                    if (!user?.id) {
                      return null;
                    }

                    const fullName =
                      [
                        user.first_name,
                        user.last_name,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(" ")
                        .trim();

                    return (
                      <option
                        key={
                          member?.id ??
                          user.id ??
                          index
                        }
                        value={
                          user.id
                        }
                      >
                        {fullName ||
                          user.email ||
                          `User ${user.id}`}

                        {user.email &&
                        fullName
                          ? ` (${user.email})`
                          : ""}
                      </option>
                    );
                  },
                )}
              </select>

              {safeMembers.length ===
                0 && (
                <p className="mt-2 text-xs font-medium text-amber-600">
                  No active project
                  members are currently
                  available.
                </p>
              )}
            </FormField>

            {/* =================================
                PRIORITY + DUE DATE
            ================================== */}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* PRIORITY */}

              <FormField label="Priority">
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

              <FormField label="Due date">
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

            {/* =================================
                STATUS INFORMATION
            ================================== */}

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-[#3563E9]">
                  i
                </div>

                <div>
                  <p className="text-sm font-bold text-[#14223A]">
                    Task status is not
                    edited here
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Current status:{" "}
                    <span className="font-extrabold">
                      {formatStatus(
                        task?.status,
                      )}
                    </span>
                    . Use the task status
                    workflow on the Task
                    Details page to update
                    it.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                ACTION BUTTONS
            ================================== */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  onClose?.()
                }
                disabled={
                  isUpdating
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
                type="submit"
                disabled={
                  isUpdating
                }
                className="
                  inline-flex
                  min-w-[145px]
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#3563E9]
                  px-6
                  py-3
                  text-sm
                  font-extrabold
                  text-white
                  shadow-[0_8px_20px_rgba(53,99,233,0.22)]
                  transition
                  hover:bg-[#2F58D3]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
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

// ==========================================
// FORM FIELD
// ==========================================

const FormField = ({
  label,
  required = false,
  children,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#14223A]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
};

// ==========================================
// INPUT STYLE
// ==========================================

const inputClass = `
  w-full
  rounded-xl
  border
  border-slate-300
  bg-slate-50
  px-4
  py-3.5
  text-sm
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
`;

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

export default EditTaskModal;