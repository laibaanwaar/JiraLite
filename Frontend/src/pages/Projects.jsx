const Projects = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-3xl font-black text-[#172B4D]">
          Projects
        </h1>

        <p className="mt-2 text-slate-500">
          View and manage your projects.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
            <p className="text-slate-500">
              Project data will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
