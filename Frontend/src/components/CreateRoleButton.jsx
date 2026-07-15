function CreateRoleButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#1f46b8] px-6 text-base font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#173792]"
    >
      <PlusIcon />
      <span>Create Role</span>
    </button>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path d="M10 4.5v11M4.5 10h11" strokeLinecap="round" />
    </svg>
  )
}

export default CreateRoleButton
