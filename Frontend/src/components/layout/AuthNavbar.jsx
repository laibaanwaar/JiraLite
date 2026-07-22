import { Link } from "react-router";

const AuthNavbar = () => {
  const user = getStoredUser();
  const initials = getInitials(user);

  return (
    <header className="flex h-[72px] items-center justify-end border-b border-slate-200 bg-white px-5 sm:px-6 lg:px-8">
      <Link
        to="/profile"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6C63FF] text-sm font-black text-white shadow-sm ring-2 ring-white transition hover:brightness-95"
        aria-label="Profile"
      >
        {initials}
      </Link>
    </header>
  );
};

const getStoredUser = () => {
  try {
    const rawUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const getInitials = (user) => {
  const firstName =
    user?.first_name ||
    user?.firstName ||
    "";
  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim();

  return initials || "U";
};

export default AuthNavbar;
