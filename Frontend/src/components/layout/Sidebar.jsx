import { NavLink, useNavigate } from "react-router";

import { sidebarItems } from "../../constants/sidebarItems";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside
      className={`relative flex min-h-screen flex-col bg-[#0F1B2D] text-white transition-all duration-300 ${
        collapsed ? "w-[76px]" : "w-[260px]"
      }`}
    >
      {/* Logo / Header */}
      <div
        className={`flex h-[92px] items-center border-b border-white/10 px-5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-xl font-black">
              J
            </div>

            <span className="text-2xl font-black">
              JiraLite
            </span>
          </div>
        )}

        {collapsed && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-lg font-black">
            J
          </div>
        )}

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Hamburger when collapsed */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-4 flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Expand sidebar"
        >
          <MenuIcon />
        </button>
      )}

      {/* Navigation */}
      <nav className="mt-5 flex-1 space-y-2 px-3">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                "flex h-[54px] items-center rounded-xl font-semibold transition-all duration-200",
                collapsed
                  ? "justify-center px-2"
                  : "gap-4 px-4",
                isActive
                  ? "bg-[#1B2B46] text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
          >
            <SidebarIcon type={item.icon} />

            {!collapsed && (
              <span className="text-base">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`flex h-[54px] w-full items-center rounded-xl text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 ${
            collapsed
              ? "justify-center"
              : "gap-4 px-4"
          }`}
        >
          <LogoutIcon />

          {!collapsed && (
            <span className="font-semibold">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

const SidebarIcon = ({ type }) => {
  const common =
    "h-5 w-5 shrink-0 stroke-current";

  if (type === "dashboard") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (type === "projects") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
      >
        <path d="M3 7.5h6l2 2h10v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />
        <path d="M3 7.5V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2.5" />
      </svg>
    );
  }

  if (type === "tasks") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.8-3.4 2.7-5 5.5-5s4.7 1.6 5.5 5" />
        <path d="M16 5.5a3 3 0 0 1 0 5.5M16 14c2.5.2 4 1.8 4.5 5" />
      </svg>
    );
  }

  if (type === "invitations") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (type === "roles") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
      >
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="16" r="3" />
        <path d="M10.5 10.5 13.5 13.5" />
      </svg>
    );
  }

  return null;
};

const CloseIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const MenuIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
    <path d="M14 8l4 4-4 4M18 12H8" />
  </svg>
);

export default Sidebar;