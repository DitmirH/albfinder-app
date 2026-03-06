import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Login from '../Login'

describe('Login', () => {
  describe('rendering', () => {
    it('renders login form with all fields', () => {
      render(<Login onLogin={vi.fn()} />)
      
      expect(screen.getByText('AlbFinder')).toBeInTheDocument()
      expect(screen.getByText('UK Company Director Intelligence')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('renders logo with AF text', () => {
      render(<Login onLogin={vi.fn()} />)
      expect(screen.getByText('AF')).toBeInTheDocument()
    })

    it('renders footer text', () => {
      render(<Login onLogin={vi.fn()} />)
      expect(screen.getByText('Albanian Company Directors in the UK')).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('submits username and password when credentials are valid', async () => {
      const onLogin = vi.fn(() => true)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByPlaceholderText('Enter username'), 'test@albfinder.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password12345')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      expect(onLogin).toHaveBeenCalledWith('test@albfinder.com', 'password12345')
      expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument()
    })

    it('shows error state when credentials are invalid', async () => {
      const onLogin = vi.fn(() => false)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByPlaceholderText('Enter username'), 'bad-user')
      await user.type(screen.getByPlaceholderText('Enter password'), 'bad-pass')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      expect(onLogin).toHaveBeenCalledWith('bad-user', 'bad-pass')
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
    })

    it('clears error when form is resubmitted', async () => {
      const onLogin = vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByPlaceholderText('Enter username'), 'bad-user')
      await user.type(screen.getByPlaceholderText('Enter password'), 'bad-pass')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()

      await user.clear(screen.getByPlaceholderText('Enter username'))
      await user.clear(screen.getByPlaceholderText('Enter password'))
      await user.type(screen.getByPlaceholderText('Enter username'), 'good-user')
      await user.type(screen.getByPlaceholderText('Enter password'), 'good-pass')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument()
    })

    it('submits form on Enter key', async () => {
      const onLogin = vi.fn(() => true)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByPlaceholderText('Enter username'), 'test@test.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'pass123{enter}')

      expect(onLogin).toHaveBeenCalledWith('test@test.com', 'pass123')
    })
  })

  describe('password visibility toggle', () => {
    it('starts with password hidden', () => {
      render(<Login onLogin={vi.fn()} />)
      expect(screen.getByPlaceholderText('Enter password')).toHaveAttribute('type', 'password')
    })

    it('toggles password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<Login onLogin={vi.fn()} />)

      const passwordInput = screen.getByPlaceholderText('Enter password')
      const toggleButton = passwordInput.parentElement.querySelector('button')

      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('input handling', () => {
    it('updates username state on input change', async () => {
      const user = userEvent.setup()
      render(<Login onLogin={vi.fn()} />)

      const usernameInput = screen.getByPlaceholderText('Enter username')
      await user.type(usernameInput, 'testuser')

      expect(usernameInput).toHaveValue('testuser')
    })

    it('updates password state on input change', async () => {
      const user = userEvent.setup()
      render(<Login onLogin={vi.fn()} />)

      const passwordInput = screen.getByPlaceholderText('Enter password')
      await user.type(passwordInput, 'testpass')

      expect(passwordInput).toHaveValue('testpass')
    })

    it('username input has autofocus', () => {
      render(<Login onLogin={vi.fn()} />)
      expect(screen.getByPlaceholderText('Enter username')).toHaveFocus()
    })
  })
})
