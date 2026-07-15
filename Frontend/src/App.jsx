import { useEffect, useState } from 'react'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Projects from './pages/Projects'
import Roles from './pages/Roles'
import Tasks from './pages/Tasks'
import Users from './pages/Users'
import { hasStoredAuthSession } from './services/authService'

function getCurrentPath() {
  return window.location.pathname
}

function App() {
  const [currentPath, setCurrentPath] = useState(getCurrentPath)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getCurrentPath())
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('app:navigate', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('app:navigate', handleLocationChange)
    }
  }, [])

  if (
    (currentPath === '/dashboard' ||
      currentPath === '/projects' ||
      currentPath === '/tasks' ||
      currentPath === '/users' ||
      currentPath === '/roles') &&
    !hasStoredAuthSession()
  ) {
    window.history.replaceState({}, '', '/')
    return <Login />
  }

  if (currentPath === '/dashboard' && hasStoredAuthSession()) {
    return <Dashboard />
  }

  if (currentPath === '/projects' && hasStoredAuthSession()) {
    return <Projects />
  }

  if (currentPath === '/tasks' && hasStoredAuthSession()) {
    return <Tasks />
  }

  if (currentPath === '/roles' && hasStoredAuthSession()) {
    return <Roles />
  }

  if (currentPath === '/users' && hasStoredAuthSession()) {
    return <Users />
  }

  return <Login />
}

export default App
