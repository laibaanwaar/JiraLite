function ActionButton({ isActive, isLoading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
        isActive ? 'text-[#d44343] hover:text-[#ba2e2e]' : 'text-[#8a9ac5] hover:text-[#6578ad]'
      }`}
    >
      {isLoading ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
    </button>
  )
}

export default ActionButton
