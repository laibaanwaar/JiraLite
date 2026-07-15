function StatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive ? 'bg-[#efe7ff] text-[#7d5de0]' : 'bg-[#edf1f7] text-[#8b95a7]'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default StatusBadge
