function EmptyState({ title, description }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
}

export default EmptyState
