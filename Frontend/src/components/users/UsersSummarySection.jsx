import SummaryCard from './SummaryCard'

const CARD_CONFIG = [
  {
    title: 'Total Users',
    valueKey: 'totalUsers',
    icon: UsersIcon,
    iconClassName: 'bg-[#f2efff] text-[#7a60d8]',
  },
  {
    title: 'Active Now',
    valueKey: 'activeNow',
    icon: PulseIcon,
    iconClassName: 'bg-[#eef2ff] text-[#4e63d8]',
  },
  {
    title: 'Open Invites',
    valueKey: 'openInvites',
    icon: MailIcon,
    iconClassName: 'bg-[#fff3e8] text-[#d69445]',
  },
]

function UsersSummarySection({ summary, isLoading, errorMessage, onRetry }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 xl:grid-cols-3">
        {CARD_CONFIG.map(({ title, valueKey, icon: Icon, iconClassName }) => (
          <SummaryCard
            key={title}
            title={title}
            value={summary[valueKey] ?? 0}
            icon={Icon}
            iconClassName={iconClassName}
            isLoading={isLoading}
          />
        ))}
      </div>

      {errorMessage ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="11" r="3" />
      <path d="M19 19a3 3 0 0 0-2-2.83M17 8.5a2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h4l2-5 4 10 2-5h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7.75A1.75 1.75 0 0 1 5.75 6h12.5A1.75 1.75 0 0 1 20 7.75v8.5A1.75 1.75 0 0 1 18.25 18H5.75A1.75 1.75 0 0 1 4 16.25Z" />
      <path d="m5 8 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default UsersSummarySection
