function Pill({ children, active = false }) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold ${
        active ? 'bg-white text-[#2142a5] shadow-sm' : 'text-slate-500'
      }`}
    >
      {children}
    </div>
  )
}

function UsersToolbar() {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-[2rem] font-black tracking-tight text-slate-900">Team Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure access levels and manage member status across the workspace.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-[#eef2ff] p-1">
          <Pill active>Users</Pill>
          <Pill>Roles</Pill>
        </div>

        <button
          type="button"
          className="inline-flex h-20 min-w-40 flex-col items-center justify-center gap-1 rounded-2xl bg-[#1f46b8] px-5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-900/15"
        >
          <InviteIcon />
          <span>Invite User</span>
        </button>
      </div>
    </div>
  )
}

function InviteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="11" r="3" />
      <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
    </svg>
  )
}

export default UsersToolbar
