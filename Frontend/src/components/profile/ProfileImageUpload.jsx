function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 16V8m0 0-3 3m3-3 3 3M5.75 16.75v.5a1 1 0 0 0 1 1h10.5a1 1 0 0 0 1-1v-.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function ProfileImageUpload({
  error,
  initials,
  onChange,
  previewUrl,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-800 via-slate-500 to-[#c98152] text-2xl font-extrabold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="profileImage"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500"
          >
            <UploadIcon />
            Upload Image
          </label>
          <input
            id="profileImage"
            name="profile_image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={onChange}
            className="sr-only"
          />
          <p className="m-0 text-xs font-medium text-slate-500">
            JPG, JPEG, PNG, or WebP up to 5 MB.
          </p>
        </div>
      </div>

      {error ? (
        <p className="m-0 text-sm font-semibold text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
