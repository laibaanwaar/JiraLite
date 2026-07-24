import {
  useEffect,
  useState,
} from "react";

const INITIAL_FORM = {
  name: "",
  project_key: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "ACTIVE",
};

const EditProjectModal = ({
  isOpen,
  project,
  onClose,
  onUpdate,
  isUpdating = false,
}) => {
  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [initialData, setInitialData] =
    useState(INITIAL_FORM);

  const [
    validationError,
    setValidationError,
  ] = useState("");

  // ==========================================
  // LOAD SELECTED PROJECT INTO FORM
  // ==========================================

  useEffect(() => {
    if (!isOpen || !project) {
      return;
    }

    const values = {
      name:
        project?.name || "",

      project_key:
        project?.project_key || "",

      description:
        project?.description || "",

      start_date:
        project?.start_date || "",

      end_date:
        project?.end_date || "",

      status:
        project?.status ||
        "ACTIVE",
    };

    setFormData(values);

    setInitialData(values);

    setValidationError("");
  }, [
    isOpen,
    project,
  ]);

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

  if (!isOpen || !project) {
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

        [name]:
          name ===
          "project_key"
            ? value.toUpperCase()
            : value,
      }),
    );

    setValidationError("");
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleClose = () => {
    if (isUpdating) {
      return;
    }

    setValidationError("");

    onClose();
  };

  // ==========================================
  // VALIDATE + BUILD PATCH PAYLOAD
  // ==========================================

  const buildPayload = () => {
    const name =
      formData.name.trim();

    const projectKey =
      formData.project_key
        .trim()
        .toUpperCase();

    const description =
      formData.description.trim();

    if (!name) {
      throw new Error(
        "Project name is required.",
      );
    }

    if (name.length < 3) {
      throw new Error(
        "Project name must be at least 3 characters.",
      );
    }

    if (!projectKey) {
      throw new Error(
        "Project key is required.",
      );
    }

    const projectKeyPattern =
      /^[A-Z][A-Z0-9_-]*$/;

    if (
      !projectKeyPattern.test(
        projectKey,
      )
    ) {
      throw new Error(
        "Project key must start with a letter and contain only uppercase letters, numbers, underscores, or hyphens.",
      );
    }

    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date <
        formData.start_date
    ) {
      throw new Error(
        "End date cannot be before start date.",
      );
    }

    const allowedStatuses = [
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ];

    if (
      !allowedStatuses.includes(
        formData.status,
      )
    ) {
      throw new Error(
        "Invalid project status.",
      );
    }

    /*
      PATCH API supports partial update.

      Therefore only changed fields
      are included in the request.
    */

    const payload = {};

    if (
      name !==
      initialData.name.trim()
    ) {
      payload.name = name;
    }

    if (
      projectKey !==
      initialData.project_key
        .trim()
        .toUpperCase()
    ) {
      payload.project_key =
        projectKey;
    }

    if (
      description !==
      initialData.description.trim()
    ) {
      payload.description =
        description;
    }

    if (
      formData.start_date !==
      initialData.start_date
    ) {
      payload.start_date =
        formData.start_date ||
        null;
    }

    if (
      formData.end_date !==
      initialData.end_date
    ) {
      payload.end_date =
        formData.end_date ||
        null;
    }

    if (
      formData.status !==
      initialData.status
    ) {
      payload.status =
        formData.status;
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

    try {
      const payload =
        buildPayload();

      if (
        Object.keys(payload)
          .length === 0
      ) {
        setValidationError(
          "No changes were made.",
        );

        return;
      }

      if (
        typeof onUpdate !==
        "function"
      ) {
        setValidationError(
          "Update handler is not available.",
        );

        return;
      }

      await onUpdate(payload);
    } catch (error) {
      setValidationError(
        error?.message ||
          "Unable to validate project.",
      );
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
            sm:p-8
          "
        >

          {/* CLOSE */}

          <button
            type="button"
            onClick={handleClose}
            disabled={
              isUpdating
            }
            aria-label="Close edit project modal"
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
              Edit project
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update project
              information and settings.
            </p>

          </div>

          {/* ERROR */}

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

            {/* PROJECT NAME */}

            <div>

              <label
                htmlFor="edit-project-name"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Project name *
              </label>

              <input
                id="edit-project-name"
                type="text"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                disabled={
                  isUpdating
                }
                placeholder="Project name"
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
                  transition
                  focus:border-[#3563E9]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#3563E9]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

            </div>

            {/* PROJECT KEY */}

            <div>

              <label
                htmlFor="edit-project-key"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Project key *
              </label>

              <input
                id="edit-project-key"
                type="text"
                name="project_key"
                value={
                  formData.project_key
                }
                onChange={
                  handleChange
                }
                disabled={
                  isUpdating
                }
                placeholder="WEB2"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3.5
                  uppercase
                  text-[#14223A]
                  outline-none
                  transition
                  focus:border-[#3563E9]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#3563E9]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Must start with a
                letter. Only letters,
                numbers, underscores
                and hyphens are allowed.
              </p>

            </div>

            {/* DESCRIPTION */}

            <div>

              <label
                htmlFor="edit-project-description"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Description
              </label>

              <textarea
                id="edit-project-description"
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
                placeholder="Project description"
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3.5
                  text-[#14223A]
                  outline-none
                  transition
                  focus:border-[#3563E9]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#3563E9]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

            </div>

            {/* DATES */}

            <div className="grid gap-4 sm:grid-cols-2">

              {/* START DATE */}

              <div>

                <label
                  htmlFor="edit-project-start-date"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  Start date
                </label>

                <input
                  id="edit-project-start-date"
                  type="date"
                  name="start_date"
                  value={
                    formData.start_date
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isUpdating
                  }
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

              {/* END DATE */}

              <div>

                <label
                  htmlFor="edit-project-end-date"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  End date
                </label>

                <input
                  id="edit-project-end-date"
                  type="date"
                  name="end_date"
                  value={
                    formData.end_date
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isUpdating
                  }
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

            {/* STATUS */}

            <div>

              <label
                htmlFor="edit-project-status"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Status
              </label>

              <select
                id="edit-project-status"
                name="status"
                value={
                  formData.status
                }
                onChange={
                  handleChange
                }
                disabled={
                  isUpdating
                }
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

                <option value="ACTIVE">
                  Active
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="ARCHIVED">
                  Archived
                </option>

              </select>

            </div>

            {/* BUTTONS */}

            <div className="space-y-3 pt-2">

              <button
                type="submit"
                disabled={
                  isUpdating
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
                {isUpdating
                  ? "Saving changes..."
                  : "Save changes"}
              </button>

              <button
                type="button"
                onClick={
                  handleClose
                }
                disabled={
                  isUpdating
                }
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

export default EditProjectModal;