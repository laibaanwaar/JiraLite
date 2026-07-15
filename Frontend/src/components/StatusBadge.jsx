function StatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
        isActive ? 'bg-[#eef2ff] text-[#3355c5]' : 'bg-[#edf1f6] text-[#6f7b8f]'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default StatusBadge
