const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
