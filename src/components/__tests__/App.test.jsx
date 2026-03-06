import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}))

vi.mock('../Dashboard', () => ({
  default: ({ onLogout }) => (
    <div data-testid="dashboard">
      Dashboard
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}))

vi.mock('../DirectorDetailPage', () => ({
  default: () => <div data-testid="director-detail">Director Detail</div>,
}))

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubEnv('VITE_USERS', '{"test@test.com":"password123"}')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('shows login page when not authenticated', async () => {
    const App = (await import('../../App')).default
    render(<App />)
    
    expect(screen.getByText('AlbFinder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument()
  })

  it('allows login with valid credentials', async () => {
    const App = (await import('../../App')).default
    const user = userEvent.setup()
    
    render(<App />)
    
    await user.type(screen.getByPlaceholderText('Enter username'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Enter password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
  })

  it('shows error with invalid credentials', async () => {
    const App = (await import('../../App')).default
    const user = userEvent.setup()
    
    render(<App />)
    
    await user.type(screen.getByPlaceholderText('Enter username'), 'wrong@test.com')
    await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    
    expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
  })

  it('restores session from sessionStorage', async () => {
    sessionStorage.setItem('albfinder_auth', 'true')
    vi.resetModules()
    
    const App = (await import('../../App')).default
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
  })

  it('logs out and shows login page', async () => {
    sessionStorage.setItem('albfinder_auth', 'true')
    vi.resetModules()
    
    const App = (await import('../../App')).default
    const user = userEvent.setup()
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
    
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument()
    })
  })
})
