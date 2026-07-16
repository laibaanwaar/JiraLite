import { useEffect, useRef, useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import {
  acceptProjectInvitation,
  getProjectInvitationErrorMessage,
  isCompletedInvitationMessage,
} from '../services/projectService.js'

function getInvitationToken() {
  const params = new URLSearchParams(window.location.search)
  return params.get('token')?.trim() || ''
}

export default function ProjectInvitationResponsePage() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const requestStartedRef = useRef(false)
  const token = getInvitationToken()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invitation token is missing.')
      return
    }

    if (requestStartedRef.current) {
      return
    }

    requestStartedRef.current = true
    setStatus('loading')
    setMessage('')

    acceptProjectInvitation({ token })
      .then((response) => {
        setStatus('success')
        setMessage(response?.message || 'Invitation accepted successfully.')
      })
      .catch((error) => {
        const nextMessage = getProjectInvitationErrorMessage(error, 'Unable to process this invitation right now.')

        if (isCompletedInvitationMessage(nextMessage)) {
          setStatus('success')
          setMessage(nextMessage)
          return
        }

        setStatus('error')
        setMessage(nextMessage)
      })
  }, [token])

  return (
    <AuthLayout>
      <section
        className="w-full max-w-[760px] rounded-[28px] border border-slate-200/90 bg-white/95 px-5 py-7 shadow-[0_24px_60px_rgba(74,102,170,0.18)] backdrop-blur-[6px] sm:px-[34px] sm:py-[30px]"
        aria-labelledby="project-invitation-title"
      >
        <h1
          id="project-invitation-title"
          className="m-0 text-[2.25rem] font-extrabold leading-[1.1] text-slate-900 max-[480px]:text-[1.85rem]"
        >
          Project Invitation
        </h1>
        <p className="mb-7 mt-3 text-[1rem] leading-[1.6] text-slate-500">
          Review this invitation and complete the response.
        </p>

        {status === 'loading' ? (
          <p
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.98rem] font-semibold text-slate-700"
            role="status"
          >
            Processing invitation...
          </p>
        ) : null}

        {status === 'success' ? (
          <p
            className="rounded-xl border border-emerald-300/50 bg-emerald-50/90 px-4 py-3 text-[0.98rem] font-semibold text-emerald-700"
            role="status"
          >
            {message}
          </p>
        ) : null}

        {status === 'error' ? (
          <p
            className="rounded-xl border border-rose-300/50 bg-rose-50/90 px-4 py-3 text-[0.98rem] font-semibold text-rose-700"
            role="alert"
          >
            {message}
          </p>
        ) : null}
      </section>
    </AuthLayout>
  )
}
