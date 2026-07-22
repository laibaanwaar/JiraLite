const workspaceItems = [
  "Project Management",
  "Task Tracking",
  "Team Collaboration",
  "Role Management",
  "Progress Dashboard",
];

const TrustedSection = () => {
  return (
    <section id="solutions" className="bg-white py-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 sm:text-sm">
            One workspace for your entire team
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {workspaceItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-600 shadow-[0_8px_25px_rgba(23,43,77,0.06)] transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 hover:text-[#0C66E4] hover:shadow-[0_18px_40px_rgba(12,102,228,0.13)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* About block */}
        <div
          id="about"
          className="mt-20 overflow-hidden rounded-[32px] bg-[#06152F] p-8 shadow-[0_30px_80px_rgba(6,21,47,0.2)] sm:p-12"
        >
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-400">
                Built for productive teams
              </p>

              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                Keep your projects organized from start to finish.
              </h2>
            </div>

            <p className="text-base leading-8 text-slate-300">
              Create projects, invite registered team members, assign work,
              monitor task progress, and keep your entire project workflow in
              one organized place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedSection;