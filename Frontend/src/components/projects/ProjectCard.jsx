import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router";

const ProjectCard = ({
  project,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const menuRef = useRef(null);

  const members = Array.isArray(
    project?.members,
  )
    ? project.members
    : [];

  const totalTasks =
    project?.total_tasks ?? 0;

  const progress =
    project?.progress ?? 0;

  /*
    Only the project ADMIN can
    update or delete the project.
  */
  const canManageProject =
    project?.current_user_role ===
    "ADMIN";

  /*
    Backend rule:

    Archived projects cannot
    be modified.

    Delete permission is still
    controlled by backend ADMIN
    permission.
  */
  const isArchived =
    project?.status === "ARCHIVED";

  // ==========================================
  // CLOSE ACTION MENU ON OUTSIDE CLICK
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (
      event,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target,
        )
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  // ==========================================
  // OPEN SELECTED PROJECT
  // ==========================================

  const handleOpenProject = () => {
    if (!project?.id) {
      return;
    }

    navigate(
      `/projects/${project.id}`,
    );
  };

  // ==========================================
  // OPEN / CLOSE ACTION MENU
  // ==========================================

  const handleToggleMenu = (
    event,
  ) => {
    /*
      Prevent ProjectCard's click
      handler from navigating to
      project details.
    */

    event.stopPropagation();

    setIsMenuOpen(
      (previous) => !previous,
    );
  };

  // ==========================================
  // EDIT PROJECT
  // ==========================================

  const handleEditProject = (
    event,
  ) => {
    event.stopPropagation();

    /*
      Backend does not allow an
      archived project to be modified.
    */

    if (isArchived) {
      return;
    }

    setIsMenuOpen(false);

    if (
      typeof onEdit === "function"
    ) {
      onEdit(project);
    }
  };

  // ==========================================
  // DELETE PROJECT
  // ==========================================

  const handleDeleteProject = (
    event,
  ) => {
    event.stopPropagation();

    setIsMenuOpen(false);

    if (
      typeof onDelete === "function"
    ) {
      onDelete(project);
    }
  };

  // ==========================================
  // MEMBER INITIALS
  // ==========================================

  const getInitials = (member) => {
    const user =
      member?.user || member;

    const first =
      user?.first_name?.charAt(
        0,
      ) || "";

    const last =
      user?.last_name?.charAt(
        0,
      ) || "";

    return (
      `${first}${last}`.toUpperCase() ||
      "U"
    );
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = () => {
    switch (project?.status) {
      case "COMPLETED":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "ARCHIVED":
        return "border-slate-200 bg-slate-100 text-slate-600";

      default:
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
  };

  return (
    <article
      onClick={handleOpenProject}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        /*
          Do not open the project if
          keyboard interaction is
          happening inside the action menu.
        */

        if (
          event.target !==
          event.currentTarget
        ) {
          return;
        }

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          handleOpenProject();
        }
      }}
      style={{
        width: "100%",
        maxWidth: "420px",
      }}
      className="
        group
        relative
        cursor-pointer
        self-start
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-[0_4px_16px_rgba(15,30,51,0.05)]
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-[#3563E9]/40
        hover:shadow-[0_10px_25px_rgba(53,99,233,0.10)]
        focus:outline-none
        focus:ring-4
        focus:ring-[#3563E9]/10
      "
    >
      {/* =====================================
          KEY + STATUS + ROLE + ACTIONS
      ====================================== */}

      <div className="flex items-start justify-between gap-2">

        {/* PROJECT KEY */}

        <span className="max-w-[130px] truncate rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          {project?.project_key ||
            "PRJ"}
        </span>

        <div className="flex shrink-0 items-start gap-1.5">

          {/* STATUS */}

          <span
            className={`
              rounded-full
              border
              px-2.5
              py-1
              text-[10px]
              font-extrabold
              ${getStatusStyle()}
            `}
          >
            {project?.status ||
              "ACTIVE"}
          </span>

          {/* CURRENT USER ROLE */}

          {project?.current_user_role && (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold text-[#3563E9]">
              {
                project.current_user_role
              }
            </span>
          )}

          {/* =================================
              ADMIN ACTION MENU
          ================================== */}

          {canManageProject && (
            <div
              ref={menuRef}
              className="relative"
              onClick={(event) =>
                event.stopPropagation()
              }
              onKeyDown={(event) =>
                event.stopPropagation()
              }
            >
              {/* THREE DOT BUTTON */}

              <button
                type="button"
                onClick={
                  handleToggleMenu
                }
                aria-label="Project actions"
                aria-expanded={
                  isMenuOpen
                }
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  text-lg
                  font-black
                  leading-none
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  hover:text-[#14223A]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#3563E9]/20
                "
              >
                ⋮
              </button>

              {/* ACTION DROPDOWN */}

              {isMenuOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-9
                    z-50
                    w-[180px]
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    py-1.5
                    shadow-[0_14px_40px_rgba(15,30,51,0.16)]
                  "
                >
                  {/* EDIT PROJECT */}

                  <button
                    type="button"
                    onClick={
                      handleEditProject
                    }
                    disabled={
                      isArchived
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      px-4
                      py-2.5
                      text-left
                      text-sm
                      font-bold
                      text-[#14223A]
                      transition
                      hover:bg-slate-50
                      disabled:cursor-not-allowed
                      disabled:text-slate-400
                      disabled:hover:bg-white
                    "
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4 shrink-0"
                    >
                      <path d="M12 20h9" />

                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>

                    <span>
                      Edit project
                    </span>
                  </button>

                  {/* ARCHIVED INFO */}

                  {isArchived && (
                    <p className="px-4 pb-2 text-[10px] leading-4 text-slate-400">
                      Archived projects
                      cannot be modified.
                    </p>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  {/* DELETE PROJECT */}

                  <button
                    type="button"
                    onClick={
                      handleDeleteProject
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      px-4
                      py-2.5
                      text-left
                      text-sm
                      font-bold
                      text-red-600
                      transition
                      hover:bg-red-50
                    "
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4 shrink-0"
                    >
                      <path d="M3 6h18" />

                      <path d="M8 6V4h8v2" />

                      <path d="M19 6l-1 14H6L5 6" />

                      <path d="M10 11v5" />

                      <path d="M14 11v5" />
                    </svg>

                    <span>
                      Delete project
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================
          PROJECT INFORMATION
      ====================================== */}

      <div className="mt-3">
        <h2 className="truncate text-lg font-black leading-6 text-[#14223A] transition-colors group-hover:text-[#3563E9]">
          {project?.name ||
            "Untitled Project"}
        </h2>

        <p className="mt-1 truncate text-sm text-slate-500">
          {project?.description ||
            "No project description."}
        </p>
      </div>

      {/* =====================================
          MEMBERS + TASKS
      ====================================== */}

      <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">

        {/* MEMBERS */}

        <div>
          <p className="text-xs font-semibold text-slate-500">
            Members
          </p>

          <div className="mt-1.5 flex h-8 items-center">

            {members.length > 0 ? (
              <>
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
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#536DFE] to-[#795CF8] text-[10px] font-extrabold text-white"
                        >
                          {getInitials(
                            member,
                          )}
                        </div>
                      ),
                    )}

                </div>

                {members.length >
                  3 && (
                  <span className="ml-2 text-[10px] font-bold text-slate-500">
                    +
                    {members.length -
                      3}
                  </span>
                )}
              </>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#536DFE] text-[10px] font-extrabold text-white">
                U
              </div>
            )}

          </div>
        </div>

        {/* TASKS */}

        <div>
          <p className="text-xs font-semibold text-slate-500">
            Tasks
          </p>

          <p className="mt-1.5 text-lg font-black leading-8 text-[#14223A]">
            {totalTasks}
          </p>
        </div>
      </div>

      {/* =====================================
          PROGRESS
      ====================================== */}

      <div className="mt-3 border-t border-slate-100 pt-3">

        <div className="flex items-center justify-between">

          <span className="text-xs font-semibold text-slate-500">
            Progress
          </span>

          <span className="text-xs font-black text-[#14223A]">
            {progress}%
          </span>

        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

          <div
            className="h-full rounded-full bg-[#3563E9] transition-all duration-500"
            style={{
              width: `${Math.min(
                Math.max(
                  Number(
                    progress,
                  ) || 0,
                  0,
                ),
                100,
              )}%`,
            }}
          />

        </div>
      </div>
    </article>
  );
};

export default ProjectCard;