function Button({ type = 'button', children, disabled = false }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-xl bg-blue-800 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-800/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  )
}

export default Button
