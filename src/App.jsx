import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import DirectorDetailPage from './components/DirectorDetailPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = sessionStorage.getItem('albfinder_auth')
    if (session === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [isAuthenticated])

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard data={data} loading={loading} onLogout={handleLogout} />} />
        <Route path="/director/:id" element={<DirectorDetailPage data={data} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
