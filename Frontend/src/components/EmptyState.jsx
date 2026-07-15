function EmptyState({ title, description }) {
  return (
    <div className="px-6 py-18 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#3253c1]">
        <EmptyFolderIcon />
      </div>
      <p className="mt-5 text-lg font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function EmptyFolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.75 7.75A2.75 2.75 0 0 1 7.5 5h2.26c.6 0 1.16.28 1.52.76l.72.98c.36.48.92.76 1.52.76h2.98a2.75 2.75 0 0 1 2.75 2.75v6A2.75 2.75 0 0 1 16.5 19h-9A2.75 2.75 0 0 1 4.75 16.25v-8.5Z" />
      <path d="M9.5 12h5M9.5 15h3" strokeLinecap="round" />
    </svg>
  )
}

export default EmptyState
