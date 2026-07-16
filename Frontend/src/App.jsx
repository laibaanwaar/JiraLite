import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CreateProjectPage from './pages/projects/CreateProjectPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import TasksPage from './pages/tasks/TasksPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import { getAccessToken } from './services/authService.js'

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

  if (pathname === '/login') {
    return <LoginPage />
  }

  if (pathname === '/verify-email') {
    return <VerifyEmailPage />
  }

  if (pathname === '/profile') {
    return <ProfilePage />
  }

  if (pathname === '/projects/create') {
    return <CreateProjectPage />
  }

  if (pathname === '/tasks') {
    return <TasksPage />
  }

  if (getAccessToken()) {
    return <ProfilePage />
  }

  return <SignupPage />
}
