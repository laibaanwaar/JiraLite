import { Link } from "react-router";

const Navbar = () => {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <nav className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          {/* Jira-style logo */}
          <div className="relative h-10 w-10">
            <div className="absolute left-[7px] top-[3px] h-7 w-7 rotate-45 rounded-[5px] bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg shadow-blue-500/25" />

            <div className="absolute left-[14px] top-[10px] h-3.5 w-3.5 rotate-45 rounded-[2px] bg-white" />
          </div>

          <span className="text-[30px] font-extrabold tracking-[-1px] text-[#172B4D]">
            Jira<span className="text-[#0C66E4]">Lite</span>
          </span>
        </Link>

        {/* Center navigation */}
        <div className="hidden items-center gap-10 lg:flex">
          <a
            href="#features"
            className="text-[15px] font-semibold text-[#172B4D] transition-colors hover:text-[#0C66E4]"
          >
            Features
          </a>

          <a
            href="#solutions"
            className="text-[15px] font-semibold text-[#172B4D] transition-colors hover:text-[#0C66E4]"
          >
            Solutions
          </a>

          <a
            href="#about"
            className="text-[15px] font-semibold text-[#172B4D] transition-colors hover:text-[#0C66E4]"
          >
            About
          </a>
        </div>

        {/* Authentication */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-[#172B4D] px-4 py-2.5 text-sm font-bold text-[#172B4D] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0C66E4] hover:text-[#0C66E4] hover:shadow-lg sm:px-6"
          >
            Log in
          </Link>

          <Link
            to="/signup"
            className="rounded-lg bg-[#0C66E4] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0055CC] hover:shadow-xl hover:shadow-blue-600/30 sm:px-6"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;