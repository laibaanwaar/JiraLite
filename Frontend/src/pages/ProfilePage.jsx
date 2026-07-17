import { useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import EditProfileForm from '../components/profile/EditProfileForm.jsx'
import ProfileCard from '../components/profile/ProfileCard.jsx'
import ProfileAvatar from '../components/profile/ProfileAvatar.jsx'
import useProfile from '../hooks/useProfile.js'

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
    <AppShell activePath="/profile">
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
                  <ProfileAvatar interactive={false} size="lg" user={profile} />

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
    </AppShell>
  )
}
