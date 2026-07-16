import { useEffect, useState } from 'react'
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProjectInvitationResponsePage from './pages/ProjectInvitationResponsePage.jsx'
import ResendVerificationPage from './pages/ResendVerificationPage.jsx'
import TaskCommentsPage from './pages/TaskCommentsPage.jsx'
import CreateProjectPage from './pages/projects/CreateProjectPage.jsx'
import ProjectsPage from './pages/projects/ProjectsPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import CreateTaskPage from './pages/tasks/CreateTaskPage.jsx'
import EditTaskPage from './pages/tasks/EditTaskPage.jsx'
import MyTasksPage from './pages/tasks/MyTasksPage.jsx'
import TaskDetailPage from './pages/tasks/TaskDetailPage.jsx'
import TasksPage from './pages/tasks/TasksPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import { getAccessToken } from './services/authService.js'

const PROTECTED_PATHS = ['/profile', '/projects', '/projects/create', '/dashboard']

function isProtectedPath(pathname) {
  return (
    PROTECTED_PATHS.includes(pathname) ||
    pathname === '/tasks' ||
    pathname.startsWith('/tasks/')
  )
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return pathname
}

export default function App() {
  const pathname = usePathname()
  const isAuthenticated = Boolean(getAccessToken())
  const taskDetailMatch = pathname.match(/^\/tasks\/(\d+)$/)
  const taskEditMatch = pathname.match(/^\/tasks\/(\d+)\/edit$/)

  useEffect(() => {
    if (!isProtectedPath(pathname) || isAuthenticated) {
      return
    }

    window.history.replaceState(
      {
        authNotice: {
          message: 'Please log in to continue.',
          type: 'warning',
        },
      },
      '',
      '/login',
    )
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [isAuthenticated, pathname])

  if (pathname === '/login') {
    return <LoginPage />
  }

  if (pathname === '/verify-email') {
    return <VerifyEmailPage />
  }

  if (pathname === '/resend-verification') {
    return <ResendVerificationPage />
  }

  if (pathname === '/project-invitations/respond') {
    return <ProjectInvitationResponsePage />
  }

  if (pathname === '/profile') {
    return isAuthenticated ? <ProfilePage /> : <LoginPage />
  }

  if (pathname === '/dashboard') {
    return isAuthenticated ? <AdminDashboardPage /> : <LoginPage />
  }

  if (pathname === '/projects') {
    return isAuthenticated ? <ProjectsPage /> : <LoginPage />
  }

  if (pathname === '/projects/create') {
    return isAuthenticated ? <CreateProjectPage /> : <LoginPage />
  }

  if (pathname === '/task-comment') {
    return isAuthenticated ? <TaskCommentsPage /> : <LoginPage />
  }

  if (pathname === '/tasks') {
    return isAuthenticated ? <TasksPage /> : <LoginPage />
  }

  if (pathname === '/tasks/my') {
    return isAuthenticated ? <MyTasksPage /> : <LoginPage />
  }

  if (pathname === '/tasks/create') {
    return isAuthenticated ? <CreateTaskPage /> : <LoginPage />
  }

  if (taskEditMatch) {
    return isAuthenticated ? <EditTaskPage taskId={taskEditMatch[1]} /> : <LoginPage />
  }

  if (taskDetailMatch) {
    return isAuthenticated ? <TaskDetailPage taskId={taskDetailMatch[1]} /> : <LoginPage />
  }

  if (isAuthenticated) {
    return <ProfilePage />
  }

  return <SignupPage />
}
