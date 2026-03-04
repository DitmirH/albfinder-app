import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import DirectorDetailPage from './components/DirectorDetailPage'
import { DataProvider } from './context/DataContext'
import { isSupabaseConfigured } from './lib/supabase'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })

  const useSupabase = isSupabaseConfigured()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('albfinder_dark', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  useEffect(() => {
    const session = sessionStorage.getItem('albfinder_auth')
    if (session === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && !useSupabase) {
      fetch('/data.json')
        .then(res => res.json())
        .then(json => {
          setData(json)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load data:', err)
          setLoading(false)
        })
    } else if (isAuthenticated && useSupabase) {
      setLoading(false)
    }
  }, [isAuthenticated, useSupabase])

  // Load users from environment variables
  const getUsers = () => {
    try {
      const usersJson = import.meta.env.VITE_USERS
      if (usersJson) {
        return JSON.parse(usersJson)
      }
    } catch (e) {
      console.error('Failed to parse users from environment:', e)
    }
    // Fallback to empty object if env var is not set
    return {}
  }

  const users = getUsers()

  const handleLogin = (username, password) => {
    if (users[username] && users[username] === password) {
      setIsAuthenticated(true)
      sessionStorage.setItem('albfinder_auth', 'true')
      return true
    }
    return false
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('albfinder_auth')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const routes = (
    <Routes>
      <Route path="/" element={<Dashboard data={data} loading={loading} useSupabase={useSupabase} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
      <Route path="/director/:id" element={<DirectorDetailPage data={data} useSupabase={useSupabase} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  return (
    <BrowserRouter>
      {useSupabase ? <DataProvider>{routes}</DataProvider> : routes}
    </BrowserRouter>
  )
}

export default App
