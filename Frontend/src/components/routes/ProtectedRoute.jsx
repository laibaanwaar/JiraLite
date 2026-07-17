import { useEffect } from 'react'
import useAuth from '../../hooks/useAuth.js'
import {
  clearPostLoginRedirectPath,
  getPostLoginRedirectPath,
  storePostLoginRedirectPath,
} from '../../services/authService.js'
import { getCurrentPathWithSearch, navigateTo } from '../../utils/navigation.js'

function RouteStatus({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fd] px-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#4b36f4]" />
        <p className="mb-0 mt-5 text-sm font-semibold text-slate-600">{message}</p>
      </div>
    </div>
  )
}

function redirectToLogin() {
  storePostLoginRedirectPath(getCurrentPathWithSearch())
  navigateTo('/login', {
    replace: true,
    state: {
      authNotice: {
        message: 'Please log in to continue.',
        type: 'warning',
      },
    },
  })
}

export function PublicOnlyRoute({ children }) {
  const { dashboardPath, isAuthenticated, isRestoring } = useAuth()

  useEffect(() => {
    if (isRestoring || !isAuthenticated) {
      return
    }

    const redirectPath = getPostLoginRedirectPath()

    if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
      clearPostLoginRedirectPath()
      navigateTo(redirectPath, { replace: true })
      return
    }

    navigateTo(dashboardPath, { replace: true })
  }, [dashboardPath, isAuthenticated, isRestoring])

  if (isRestoring) {
    return <RouteStatus message="Restoring your session..." />
  }

  if (isAuthenticated) {
    return <RouteStatus message="Redirecting to your dashboard..." />
  }

  return children
}

export function ProtectedRoute({ allowedRoles, children }) {
  const { dashboardPath, isAuthenticated, isRestoring, roleCode } = useAuth()

  useEffect(() => {
    if (isRestoring) {
      return
    }

    if (!isAuthenticated) {
      redirectToLogin()
      return
    }

    if (allowedRoles?.length && !allowedRoles.includes(roleCode)) {
      navigateTo(dashboardPath, {
        replace: true,
        state: {
          authNotice: {
            message: 'You were redirected to the correct dashboard for your account.',
            type: 'warning',
          },
        },
      })
    }
  }, [allowedRoles, dashboardPath, isAuthenticated, isRestoring, roleCode])

  if (isRestoring) {
    return <RouteStatus message="Checking access..." />
  }

  if (!isAuthenticated) {
    return <RouteStatus message="Redirecting to login..." />
  }

  if (allowedRoles?.length && !allowedRoles.includes(roleCode)) {
    return <RouteStatus message="Redirecting to the right workspace..." />
  }

  return children
}

export function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>{children}</ProtectedRoute>
}

export function StrictAdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={['ADMIN']}>{children}</ProtectedRoute>
}

export function MemberRoute({ children }) {
  return <ProtectedRoute allowedRoles={['MEMBER']}>{children}</ProtectedRoute>
}
