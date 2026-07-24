import { useState } from "react";

/*
  Generate project key automatically.

  Examples:
  "Website Redesign" -> WEB4821
  "JiraLite Development" -> JIR7392

  User ko Project Key field show nahi hogi,
  lekin backend ko required project_key send hogi.
*/
const generateProjectKey = (projectName) => {
  const words = projectName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let prefix = "";

  if (words.length >= 2) {
    prefix = words
      .slice(0, 3)
      .map((word) => word[0])
      .join("");
  } else {
    prefix = words[0]?.slice(0, 3) || "PRJ";
  }

  const suffix = Date.now()
    .toString()
    .slice(-4);

  return `${prefix}${suffix}`.toUpperCase();
};

const CreateProjectModal = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
    });

    setError("");
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    resetForm();
    onClose();
  };

  // ==========================================
  // CREATE PROJECT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const projectName =
      formData.name.trim();

    // Project name validation
    if (!projectName) {
      setError(
        "Project name is required.",
      );
      return;
    }

    // Date validation
    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date <
        formData.start_date
    ) {
      setError(
        "End date cannot be before start date.",
      );
      return;
    }

    /*
      Backend requires project_key.

      It is generated internally so the user
      does not need to enter it manually.
    */
    const projectKey =
      generateProjectKey(projectName);

    const projectPayload = {
      name: projectName,

      // REQUIRED BY BACKEND
      project_key: projectKey,

      description:
        formData.description.trim(),

      start_date:
        formData.start_date || null,

      end_date:
        formData.end_date || null,

      status: "ACTIVE",
    };

    const success =
      await onCreate(projectPayload);

    if (success) {
      resetForm();
      onClose();
    }
  };

  return (
    /*
      overflow-y-auto prevents the modal from
      being cut off on smaller screens.
    */
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0F1E33]/55 px-4 py-5 backdrop-blur-[2px]">

      <div className="flex min-h-full items-center justify-center">

        {/*
          Reduced:
          - max width
          - padding
          - textarea height
          - input heights

          max-h keeps modal inside viewport.
        */}
        <div className="relative w-full max-w-[620px] max-h-[calc(100vh-40px)] overflow-y-auto rounded-[24px] bg-white px-6 py-6 shadow-[0_30px_90px_rgba(15,30,51,0.28)] sm:px-8">

          {/* ==================================
              CLOSE BUTTON
          =================================== */}

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            aria-label="Close create project modal"
            className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-[#14223A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>

          {/* ==================================
              HEADER
          =================================== */}

          <div className="px-8 text-center">
            <h2 className="text-2xl font-black tracking-[-0.7px] text-[#14223A]">
              Create project
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              You'll become the Project Admin and can
              invite team members.
            </p>
          </div>

          {/* ==================================
              ERROR MESSAGE
          =================================== */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* ==================================
              FORM
          =================================== */}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            {/* PROJECT NAME */}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Project name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Marketing Website Redesign"
                disabled={isCreating}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-base font-medium text-[#14223A] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#536DFE] focus:bg-white focus:ring-4 focus:ring-[#536DFE]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/*
              NO VISIBLE PROJECT KEY FIELD

              project_key is automatically generated
              inside handleSubmit().
            */}

            {/* DESCRIPTION */}

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-bold text-[#14223A]"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                disabled={isCreating}
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-base font-medium text-[#14223A] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#536DFE] focus:bg-white focus:ring-4 focus:ring-[#536DFE]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* DATES */}

            <div className="grid gap-4 sm:grid-cols-2">

              {/* START DATE */}

              <div>
                <label
                  htmlFor="start_date"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  Start date
                </label>

                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-[#14223A] outline-none transition hover:border-slate-400 focus:border-[#536DFE] focus:bg-white focus:ring-4 focus:ring-[#536DFE]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* END DATE */}

              <div>
                <label
                  htmlFor="end_date"
                  className="mb-2 block text-sm font-bold text-[#14223A]"
                >
                  End date
                </label>

                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-[#14223A] outline-none transition hover:border-slate-400 focus:border-[#536DFE] focus:bg-white focus:ring-4 focus:ring-[#536DFE]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

            </div>

            {/* ==================================
                ACTION BUTTONS
            =================================== */}

            <div className="space-y-3 pt-1">

              {/* CREATE */}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-xl bg-gradient-to-r from-[#3867DD] to-[#536DFE] py-3.5 font-extrabold text-white shadow-[0_10px_25px_rgba(56,103,221,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_32px_rgba(56,103,221,0.34)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {isCreating
                  ? "Creating project..."
                  : "Create project"}
              </button>

              {/* CANCEL */}

              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="w-full rounded-xl border border-slate-300 bg-white py-3.5 font-bold text-[#14223A] transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

export default CreateProjectModal;