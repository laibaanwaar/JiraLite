import { useEffect, useState } from 'react'
import { AdminRoute, ProtectedRoute, PublicOnlyRoute, StrictAdminRoute } from './components/routes/ProtectedRoute.jsx'
import useAuth from './hooks/useAuth.js'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProjectInvitationResponsePage from './pages/ProjectInvitationResponsePage.jsx'
import ResendVerificationPage from './pages/ResendVerificationPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import TaskCommentsPage from './pages/TaskCommentsPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import CreateProjectPage from './pages/projects/CreateProjectPage.jsx'
import ProjectDetailPage from './pages/projects/ProjectDetailPage.jsx'
import ProjectTasksPage from './pages/projects/ProjectTasksPage.jsx'
import ProjectsPage from './pages/projects/ProjectsPage.jsx'
import CreateTaskPage from './pages/tasks/CreateTaskPage.jsx'
import EditTaskPage from './pages/tasks/EditTaskPage.jsx'
import TaskDetailPage from './pages/tasks/TaskDetailPage.jsx'
import TasksPage from './pages/tasks/TasksPage.jsx'
import { navigateTo } from './utils/navigation.js'

function useLocationState() {
  const [locationState, setLocationState] = useState({
    pathname: window.location.pathname,
    search: window.location.search,
  })

  useEffect(() => {
    const handlePopState = () => {
      setLocationState({
        pathname: window.location.pathname,
        search: window.location.search,
      })
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return locationState
}

export default function App() {
  const { dashboardPath, isAuthenticated } = useAuth()
  const { pathname } = useLocationState()
  const projectTasksMatch = pathname.match(/^\/projects\/(\d+)\/tasks$/)
  const projectDetailMatch = pathname.match(/^\/projects\/(\d+)$/)
  const taskCommentsMatch = pathname.match(/^\/tasks\/(\d+)\/comments$/)
  const taskDetailMatch = pathname.match(/^\/tasks\/(\d+)$/)
  const taskEditMatch = pathname.match(/^\/tasks\/(\d+)\/edit$/)

  if (pathname === '/') {
    return <HomePage />
  }

  if (pathname === '/signup') {
    return <SignupPage />
  }

  if (pathname === '/login') {
    return (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    )
  }

  if (pathname === '/verify-email' || pathname === '/verify-otp') {
    return <VerifyEmailPage />
  }

  if (pathname === '/resend-verification') {
    return <ResendVerificationPage />
  }

  if (pathname === '/project-invitations/respond' || pathname === '/invitations/accept') {
    return <ProjectInvitationResponsePage />
  }

  if (pathname === '/dashboard') {
    return (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/admin/dashboard') {
    navigateTo('/dashboard', { replace: true })
    return null
  }

  if (pathname === '/member/dashboard') {
    navigateTo('/dashboard', { replace: true })
    return null
  }

  if (pathname === '/profile') {
    return (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/projects') {
    return (
      <ProtectedRoute>
        <ProjectsPage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/projects/create') {
    return (
      <AdminRoute>
        <CreateProjectPage />
      </AdminRoute>
    )
  }

  if (projectTasksMatch) {
    return (
      <ProtectedRoute>
        <ProjectTasksPage projectId={projectTasksMatch[1]} />
      </ProtectedRoute>
    )
  }

  if (projectDetailMatch) {
    return (
      <ProtectedRoute>
        <ProjectDetailPage projectId={projectDetailMatch[1]} />
      </ProtectedRoute>
    )
  }

  if (pathname === '/task-comment') {
    return (
      <ProtectedRoute>
        <TaskCommentsPage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/tasks') {
    return (
      <StrictAdminRoute>
        <TasksPage />
      </StrictAdminRoute>
    )
  }

  if (pathname === '/tasks/my') {
    navigateTo('/tasks', { replace: true })
    return null
  }

  if (pathname === '/tasks/create') {
    return (
      <AdminRoute>
        <CreateTaskPage />
      </AdminRoute>
    )
  }

  if (taskEditMatch) {
    return (
      <ProtectedRoute>
        <EditTaskPage taskId={taskEditMatch[1]} />
      </ProtectedRoute>
    )
  }

  if (taskCommentsMatch) {
    return (
      <ProtectedRoute>
        <TaskCommentsPage taskId={taskCommentsMatch[1]} />
      </ProtectedRoute>
    )
  }

  if (taskDetailMatch) {
    return (
      <ProtectedRoute>
        <TaskDetailPage taskId={taskDetailMatch[1]} />
      </ProtectedRoute>
    )
  }

  if (isAuthenticated) {
    navigateTo(dashboardPath, { replace: true })
    return null
  }

  return (
    <PublicOnlyRoute>
      <SignupPage />
    </PublicOnlyRoute>
  )
}
