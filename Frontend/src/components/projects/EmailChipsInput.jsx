const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 19a6 6 0 0 0-12 0M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function validateInviteEmail(rawEmail, emails) {
  const normalizedEmail = rawEmail.trim().toLowerCase()

  if (!normalizedEmail) {
    return { ok: false, message: 'Enter an email address.' }
  }

  if (!emailPattern.test(normalizedEmail)) {
    return { ok: false, message: 'Enter a valid email address.' }
  }

  if (emails.includes(normalizedEmail)) {
    return { ok: false, message: 'This email has already been added.' }
  }

  if (emails.length >= 20) {
    return { ok: false, message: 'You can invite up to 20 users.' }
  }

  return { ok: true, email: normalizedEmail }
}

export default function EmailChipsInput({
  error,
  inputValue,
  inviteEmails,
  onAddEmail,
  onInputChange,
  onRemoveEmail,
}) {
  const addCurrentInput = () => {
    onAddEmail(inputValue)
  }

  const handleChange = (event) => {
    const { value } = event.target

    if (value.includes(',')) {
      const emailParts = value.split(',')
      const lastPart = emailParts.pop() || ''

      emailParts.forEach((email) => onAddEmail(email))
      onInputChange(lastPart)
      return
    }

    onInputChange(value)
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    addCurrentInput()
  }

  return (
    <div>
      <label htmlFor="inviteEmail" className="text-sm font-extrabold text-slate-800">
        Add User
      </label>
      <div className="relative mt-2">
        <input
          id="inviteEmail"
          name="emailInput"
          type="email"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter email address"
          autoComplete="email"
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
        />
        <button
          type="button"
          onClick={addCurrentInput}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-50 hover:text-[#4b36f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          aria-label="Add invitation email"
        >
          <UserPlusIcon />
        </button>
      </div>

      {inviteEmails.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {inviteEmails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-2 rounded-lg bg-[#f0efff] px-3 py-1.5 text-xs font-bold text-[#4030e8]"
            >
              {email}
              <button
                type="button"
                onClick={() => onRemoveEmail(email)}
                className="rounded-full p-0.5 transition hover:bg-[#dcd8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4030e8]"
                aria-label={`Remove ${email}`}
              >
                <XIcon />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-2 text-xs font-bold text-[#4b36f4]">
        Invite will be sent to added user.
      </p>

      {error ? <p className="mt-1.5 text-sm font-medium text-rose-600">{error}</p> : null}
    </div>
  )
}
