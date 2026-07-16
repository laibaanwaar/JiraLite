export default function DeleteTaskModal({ isDeleting, isOpen, onCancel, onConfirm, taskTitle }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="m-0 text-xl font-extrabold text-slate-900">Delete task?</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
          Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:enabled:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-3 text-sm font-extrabold text-white transition hover:enabled:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
