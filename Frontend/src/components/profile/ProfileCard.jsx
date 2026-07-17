import ProfileAvatar from './ProfileAvatar.jsx'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3.75 6.75h16.5v10.5H3.75V6.75Zm0 .75L12 13.5l8.25-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7.25 4.75 9.5 9l-2 1.25a10 10 0 0 0 6.25 6.25l1.25-2 4.25 2.25-1 3a2 2 0 0 1-2.2 1.35C8.8 20.1 3.9 15.2 2.9 7.95a2 2 0 0 1 1.35-2.2l3-1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function ProfileCard({ onEdit, profile }) {
  const firstName = profile?.first_name || ''
  const lastName = profile?.last_name || ''
  const fullName = profile?.full_name || `${firstName} ${lastName}`.trim() || profile?.email || ''
  const email = profile?.email || ''
  const phone = profile?.profile?.phone || ''
  const role = profile?.role?.name || profile?.role?.code || profile?.role_code || profile?.role || 'Member'
  const designation =
    profile?.profile?.designation ||
    profile?.designation ||
    profile?.job_title ||
    profile?.profile?.job_title ||
    role

  return (
    <>
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProfileAvatar interactive={false} size="lg" user={profile} />

        <div className="min-w-0 flex-1 pt-1">
          <h2 className="m-0 text-2xl font-extrabold text-slate-900">{fullName || 'Profile'}</h2>
          <p className="mt-2 inline-flex rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#4030e8]">
            {role}
          </p>
          <dl className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
            {email ? (
              <div className="flex items-center gap-3">
                <dt className="text-slate-400">
                  <MailIcon />
                  <span className="sr-only">Email</span>
                </dt>
                <dd className="m-0">{email}</dd>
              </div>
            ) : null}
            {phone ? (
              <div className="flex items-center gap-3">
                <dt className="text-slate-400">
                  <PhoneIcon />
                  <span className="sr-only">Phone</span>
                </dt>
                <dd className="m-0">{phone}</dd>
              </div>
            ) : null}
          </dl>

          <button
            type="button"
            onClick={onEdit}
            className="mt-6 cursor-pointer rounded-lg border border-[#8b7cff] px-10 py-3 text-sm font-bold text-[#4030e8] transition hover:bg-[#f3f1ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4030e8] active:bg-[#ebe8ff]"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="my-8 h-px bg-slate-200" />

      <section aria-labelledby="designation-title">
        <h2 id="designation-title" className="m-0 text-base font-extrabold text-slate-900">
          Designation
        </h2>
        <p className="mt-4 max-w-[560px] text-base font-semibold leading-8 text-slate-600">
          {designation || 'No designation added yet.'}
        </p>
      </section>
    </>
  )
}
