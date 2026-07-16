export default function AdminDashboardEmptyState({ canCreateProject, onCreateProject, title, description }) {
  return (
    <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#4b36f4]">Admin Dashboard</p>
      <h2 className="mt-3 text-2xl font-black text-slate-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-500">{description}</p>
      {canCreateProject ? (
        <button
          type="button"
          onClick={onCreateProject}
          className="mt-6 inline-flex items-center rounded-2xl bg-[#4b36f4] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3726c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
        >
          Create Your First Project
        </button>
      ) : null}
    </section>
  )
}
