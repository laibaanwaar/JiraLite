import { useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import EditProfileForm from '../components/profile/EditProfileForm.jsx'
import ProfileCard from '../components/profile/ProfileCard.jsx'
import useProfile from '../hooks/useProfile.js'

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

export default function ProfilePage() {
  const {
    errorMessage,
    fieldErrors,
    isLoading,
    isSaving,
    profile,
    saveProfile,
    setErrorMessage,
    setSuccessMessage,
    successMessage,
  } = useProfile()
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      return
    }

    setErrorMessage('')
  }, [isEditing, setErrorMessage])

  const firstName = profile?.first_name || ''
  const lastName = profile?.last_name || ''
  const fullName = profile?.full_name || `${firstName} ${lastName}`.trim() || profile?.email || ''
  const avatarUrl = profile?.profile?.profile_image
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'JL'

  const handleEditOpen = () => {
    setSuccessMessage('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setErrorMessage('')
    setIsEditing(false)
  }

  const handleSave = async (payload) => {
    const result = await saveProfile(payload)

    if (result?.ok) {
      setIsEditing(false)
    }

    return result
  }

  return (
    <AppShell activePath="/profile" mainClassName="px-0 py-0">
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
              <div className="mt-8 animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="h-32 w-32 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-4">
                    <div className="h-7 w-48 rounded-full bg-slate-200" />
                    <div className="h-4 w-64 rounded-full bg-slate-200" />
                    <div className="h-4 w-40 rounded-full bg-slate-200" />
                    <div className="h-11 w-40 rounded-xl bg-slate-200" />
                  </div>
                </div>
              </div>
            ) : null}

            {!isLoading && successMessage ? (
              <p
                className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}

            {!isLoading && profile && !isEditing ? (
              <ProfileCard onEdit={handleEditOpen} profile={profile} />
            ) : null}

            {!isLoading && profile && isEditing ? (
              <>
                <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div
                    className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-800 via-slate-500 to-[#c98152] text-4xl font-extrabold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                    aria-label={`${fullName} profile avatar`}
                    role="img"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <h2 className="m-0 text-2xl font-extrabold text-slate-900">
                      Editing {fullName || 'Profile'}
                    </h2>
                    <p className="mt-3 max-w-[520px] text-sm font-semibold leading-7 text-slate-500">
                      Update your personal details below. Email stays visible but cannot be changed here.
                    </p>
                  </div>
                </div>

                <EditProfileForm
                  backendErrors={fieldErrors}
                  isSaving={isSaving}
                  onCancel={handleCancel}
                  onSave={handleSave}
                  profile={profile}
                />
              </>
            ) : null}
          </section>
        </main>
      </div>
    </AppShell>
  )
}
