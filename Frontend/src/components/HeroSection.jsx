import { Link } from "react-router";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#06152F] pt-[82px]">
      {/* Background depth */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[150px]" />

      <div className="pointer-events-none absolute left-[28%] top-16 h-[500px] w-[500px] rotate-45 rounded-[100px] bg-[#0C66E4]/10 blur-3xl" />

      {/* Decorative 3D shapes */}
      <div className="pointer-events-none absolute left-[42%] top-[18%] hidden h-44 w-44 rotate-45 rounded-[24px] border border-blue-400/10 bg-blue-500/5 lg:block" />

      <div className="mx-auto grid min-h-[690px] max-w-[1440px] lg:grid-cols-[48%_52%]">
        {/* =========================
            LEFT SIDE
        ========================== */}
        <div className="relative z-20 flex items-center px-6 py-20 sm:px-10 lg:px-12 xl:px-16">
          <div className="max-w-[650px]">
            {/* Label */}
            <div className="inline-flex items-center rounded-lg border border-blue-300/15 bg-blue-500/15 px-4 py-2 backdrop-blur-lg">
              <span className="text-xs font-extrabold tracking-[0.16em] text-blue-200 sm:text-sm">
                PLAN, TRACK, DELIVER
              </span>
            </div>

            {/* Main heading */}
            <h1 className="mt-7 text-[48px] font-black leading-[1.07] tracking-[-2px] text-white sm:text-[60px] lg:text-[64px] xl:text-[72px]">
              Great teams
              <br />
              build with{" "}
              <span className="bg-gradient-to-r from-[#579DFF] via-[#0C66E4] to-[#579DFF] bg-clip-text text-transparent">
                JiraLite
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-[610px] text-[17px] leading-8 text-slate-300 sm:text-[19px]">
              Bring your projects, tasks, and team together in one powerful
              workspace. Plan smarter, collaborate effectively, and deliver
              great work faster.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="group relative overflow-hidden rounded-xl bg-[#0C66E4] px-8 py-4 text-[16px] font-extrabold text-white shadow-[0_18px_50px_rgba(12,102,228,0.35)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:bg-[#0055CC] hover:shadow-[0_28px_65px_rgba(12,102,228,0.48)]"
              >
                <span className="relative z-10">Sign up — It's free</span>

                <div className="absolute inset-0 translate-y-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-transform duration-300 group-hover:translate-y-0" />
              </Link>

              <Link
                to="/login"
                className="rounded-xl border border-slate-400/80 bg-white/[0.04] px-9 py-4 text-[16px] font-bold text-white backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-xl"
              >
                Log in
              </Link>
            </div>

            {/* Benefits */}
            <div className="mt-11 flex flex-wrap gap-x-7 gap-y-4 text-sm text-slate-300">
              <Benefit text="Free for small teams" />
              <Benefit text="Simple task tracking" />
              <Benefit text="Get started in minutes" />
            </div>
          </div>
        </div>

        {/* =========================
            RIGHT IMAGE / 3D SIDE
        ========================== */}
        <div
          className="relative min-h-[540px] lg:min-h-[690px]"
          style={{ perspective: "1400px" }}
        >
          {/* Large angled blue layer */}
          <div
            className="pointer-events-none absolute -left-20 top-[8%] z-[1] hidden h-[84%] w-52 bg-[#082758]/50 lg:block"
            style={{
              clipPath: "polygon(45% 0, 100% 0, 55% 50%, 100% 100%, 45% 100%, 0 50%)",
            }}
          />

          {/* Image container */}
          <div
            className="absolute inset-4 overflow-hidden rounded-[30px] border border-white/10 shadow-[0_45px_100px_rgba(0,0,0,0.55)] transition-transform duration-700 sm:inset-8 lg:bottom-8 lg:left-0 lg:right-8 lg:top-8"
            style={{
              transform: "rotateY(-4deg) rotateX(1deg)",
              transformOrigin: "center",
            }}
          >
            <img
              src="/images/jira-hero.png"
              alt="Team collaborating on JiraLite"
              className="h-full w-full object-cover object-center"
            />

            {/* Blend image with left blue section */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#06152F]/75 via-[#06152F]/15 to-transparent" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#06152F]/30 via-transparent to-transparent" />
          </div>

          {/* Floating project progress card */}
          <div
            className="absolute bottom-[8%] left-2 z-20 hidden w-[260px] rounded-2xl border border-white/40 bg-white/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-3 hover:rotate-1 xl:block"
            style={{
              transform: "rotateY(7deg)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl font-black text-[#0C66E4]">
                ✓
              </div>

              <div>
                <p className="font-extrabold text-[#172B4D]">
                  Project Progress
                </p>

                <p className="mt-0.5 text-sm text-slate-500">78% completed</p>
              </div>
            </div>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#0C66E4] to-[#579DFF]" />
            </div>
          </div>

          {/* Floating task card */}
          <div className="absolute right-1 top-[14%] z-20 hidden rounded-2xl border border-white/30 bg-white/95 px-5 py-4 shadow-[0_25px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl xl:block">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 font-black text-emerald-600">
                ✓
              </span>

              <div>
                <p className="text-sm font-extrabold text-[#172B4D]">
                  Task completed
                </p>
                <p className="text-xs text-slate-500">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom light transition */}
      <div className="h-1 bg-gradient-to-r from-[#0C66E4] via-blue-400 to-[#0C66E4]" />
    </section>
  );
};

const Benefit = ({ text }) => {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white shadow-md shadow-emerald-500/20">
        ✓
      </span>

      <span>{text}</span>
    </div>
  );
};

export default HeroSection;