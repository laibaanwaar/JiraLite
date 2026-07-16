import { useEffect, useState } from 'react'
import ProfileImageUpload from './ProfileImageUpload.jsx'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const PHONE_PATTERN = /^\+?[0-9()\-\s]{7,20}$/

function normalizeProfile(profile) {
  return {
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.profile?.phone || '',
    bio: profile?.profile?.bio || '',
    profile_image: null,
  }
}

function getFieldError(errors, fieldName) {
  const value = errors?.[fieldName]

  if (Array.isArray(value)) {
    return value.find(Boolean) || ''
  }

  return typeof value === 'string' ? value : ''
}

function validateProfile(values) {
  const nextErrors = {}
  const firstName = values.first_name.trim()
  const lastName = values.last_name.trim()
  const phone = values.phone.trim()
  const bio = values.bio.trim()

  if (!firstName) {
    nextErrors.first_name = 'First name is required.'
  }

  if (!lastName) {
    nextErrors.last_name = 'Last name is required.'
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    nextErrors.phone = 'Enter a valid phone number.'
  }

  if (bio.length > 500) {
    nextErrors.bio = 'Bio must be 500 characters or fewer.'
  }

  if (values.profile_image) {
    if (!IMAGE_TYPES.includes(values.profile_image.type)) {
      nextErrors.profile_image = 'Profile image must be JPG, JPEG, PNG, or WebP.'
    }

    if (values.profile_image.size > MAX_IMAGE_SIZE) {
      nextErrors.profile_image = 'Profile image must be 5 MB or smaller.'
    }
  }

  return nextErrors
}

export default function EditProfileForm({
  backendErrors,
  isSaving,
  onCancel,
  onSave,
  profile,
}) {
  const [formValues, setFormValues] = useState(() => normalizeProfile(profile))
  const [clientErrors, setClientErrors] = useState({})
  const [imagePreviewUrl, setImagePreviewUrl] = useState(profile?.profile?.profile_image || '')

  useEffect(() => {
    setFormValues(normalizeProfile(profile))
    setClientErrors({})
    setImagePreviewUrl(profile?.profile?.profile_image || '')
  }, [profile])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const initials =
    `${formValues.first_name.charAt(0)}${formValues.last_name.charAt(0)}`.toUpperCase() || 'JL'

  const fieldErrors = {
    ...backendErrors,
    ...clientErrors,
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))

    setClientErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null

    setFormValues((currentValues) => ({
      ...currentValues,
      profile_image: file,
    }))

    setClientErrors((currentErrors) => ({
      ...currentErrors,
      profile_image: '',
    }))

    setImagePreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrl)
      }

      return file ? URL.createObjectURL(file) : profile?.profile?.profile_image || ''
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextValues = {
      ...formValues,
      first_name: formValues.first_name.trim(),
      last_name: formValues.last_name.trim(),
      phone: formValues.phone.trim(),
      bio: formValues.bio.trim(),
    }

    const validationErrors = validateProfile(nextValues)
    setClientErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const result = await onSave(nextValues)

    if (!result?.ok) {
      return
    }

    setClientErrors({})
  }

  return (
    <form
      className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/70 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-6">
        <ProfileImageUpload
          error={getFieldError(fieldErrors, 'profile_image')}
          initials={initials}
          onChange={handleImageChange}
          previewUrl={imagePreviewUrl}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">First Name</span>
            <input
              name="first_name"
              value={formValues.first_name}
              onChange={handleChange}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoComplete="given-name"
            />
            {getFieldError(fieldErrors, 'first_name') ? (
              <span className="text-sm font-semibold text-rose-600" role="alert">
                {getFieldError(fieldErrors, 'first_name')}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Last Name</span>
            <input
              name="last_name"
              value={formValues.last_name}
              onChange={handleChange}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoComplete="family-name"
            />
            {getFieldError(fieldErrors, 'last_name') ? (
              <span className="text-sm font-semibold text-rose-600" role="alert">
                {getFieldError(fieldErrors, 'last_name')}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Email Address</span>
            <input
              value={profile?.email || ''}
              disabled
              readOnly
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500 outline-none"
              autoComplete="email"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Phone</span>
            <input
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoComplete="tel"
            />
            {getFieldError(fieldErrors, 'phone') ? (
              <span className="text-sm font-semibold text-rose-600" role="alert">
                {getFieldError(fieldErrors, 'phone')}
              </span>
            ) : null}
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Bio</span>
          <textarea
            name="bio"
            value={formValues.bio}
            onChange={handleChange}
            rows={5}
            maxLength={500}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <div className="flex items-center justify-between gap-3">
            {getFieldError(fieldErrors, 'bio') ? (
              <span className="text-sm font-semibold text-rose-600" role="alert">
                {getFieldError(fieldErrors, 'bio')}
              </span>
            ) : (
              <span className="text-sm font-medium text-slate-500">Maximum 500 characters.</span>
            )}
            <span className="text-xs font-semibold text-slate-400">{formValues.bio.length}/500</span>
          </div>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#4030e8] px-5 text-sm font-bold text-white shadow-[0_16px_28px_rgba(64,48,232,0.22)] transition hover:enabled:bg-[#3423de] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4030e8] active:enabled:bg-[#2919cc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:enabled:border-slate-400 hover:enabled:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 active:enabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
