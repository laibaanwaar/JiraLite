export default function DashboardErrorState({ message, onRetry }) {
  return (
    <section className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="max-w-xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-600">Dashboard Error</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">We could not load your dashboard.</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center rounded-2xl bg-[#4b36f4] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3726c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
        >
          Retry
        </button>
      </div>
    </section>
  )
}
