import { useEffect, useState } from 'react'
import Sidebar from '../components/layout/Sidebar.jsx'
import { getAccessToken, getProfile, getStoredUser } from '../services/authService.js'

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M17.5 10.5a5.5 5.5 0 0 0-11 0v3.75L5 17h14l-1.5-2.75V10.5ZM10 19h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

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

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    return getStoredUser()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = getAccessToken()

    if (!token) {
      setIsLoading(false)
      setErrorMessage('Login is required to view your profile.')
      return
    }

    getProfile(token)
      .then((response) => {
        setProfile(response.data)
      })
      .catch(() => {
        setErrorMessage('Unable to load your profile right now.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const firstName = profile?.first_name || ''
  const lastName = profile?.last_name || ''
  const fullName = profile?.full_name || `${firstName} ${lastName}`.trim() || profile?.email || ''
  const email = profile?.email || ''
  const phone = profile?.profile?.phone || ''
  const bio = profile?.profile?.bio || ''
  const avatarUrl = profile?.profile?.profile_image
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'JL'

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1180px] overflow-hidden border-x border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="hidden md:block">
          <Sidebar activePath="/profile" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:justify-end md:px-8">
            <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900 md:hidden">
              <span className="text-[#2d5bff]">Jira</span>Lite
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="Notifications"
              >
                <BellIcon />
              </button>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#243b6b] via-[#c1784a] to-[#f4c29a] text-xs font-bold text-white shadow-sm"
                aria-label={`${fullName} profile avatar`}
                role="img"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 md:px-10 md:py-8">
            <section className="max-w-[720px]" aria-labelledby="profile-title">
              <h1 id="profile-title" className="m-0 text-2xl font-extrabold text-slate-900">
                My Profile
              </h1>

              {errorMessage ? (
                <p
                  className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              {isLoading ? (
                <p className="mt-6 text-sm font-semibold text-slate-500">Loading profile...</p>
              ) : null}

              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-800 via-slate-500 to-[#c98152] text-4xl font-extrabold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="m-0 text-2xl font-extrabold text-slate-900">
                    {fullName || 'Profile'}
                  </h2>
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
                    className="mt-6 rounded-lg border border-[#8b7cff] px-10 py-3 text-sm font-bold text-[#4030e8] transition hover:bg-[#f3f1ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4030e8] active:bg-[#ebe8ff]"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="my-8 h-px bg-slate-200" />

              {bio ? (
                <section aria-labelledby="about-title">
                  <h2 id="about-title" className="m-0 text-base font-extrabold text-slate-900">
                    About Me
                  </h2>
                  <p className="mt-4 max-w-[560px] text-base font-semibold leading-8 text-slate-600">
                    {bio}
                  </p>
                </section>
              ) : null}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
