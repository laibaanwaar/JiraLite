function RoleSearch({ value, onChange }) {
  return (
    <div className="relative w-full max-w-xl">
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search roles by name or code..."
        className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4f6ed8] focus:ring-4 focus:ring-blue-100"
      />
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export default RoleSearch
