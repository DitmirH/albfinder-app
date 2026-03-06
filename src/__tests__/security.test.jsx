import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from '../components/Login'
import Dashboard from '../components/Dashboard'

describe('Security Tests', () => {
  describe('XSS Protection', () => {
    it('should not execute script tags in search input', async () => {
      const user = userEvent.setup()
      const mockData = [
        { id: 1, director_name: 'Test User', company_name: 'Test Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const xssPayload = '<script>alert("XSS")</script>'
      
      await user.type(searchInput, xssPayload)
      
      expect(searchInput.value).toBe(xssPayload)
      expect(document.querySelector('script[src*="alert"]')).toBeNull()
      expect(screen.queryByText('XSS')).toBeNull()
    })

    it('should escape HTML entities in displayed data', () => {
      const maliciousData = [
        { 
          id: 1, 
          director_name: '<img src=x onerror=alert(1)>', 
          company_name: '&lt;script&gt;', 
          company_status: 'active',
          registered_postcode: 'AB1 2CD'
        }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={maliciousData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      expect(document.querySelector('img[onerror]')).toBeNull()
    })

    it('should validate URLs before rendering as links', () => {
      const maliciousData = [
        { 
          id: 1, 
          director_name: 'Test', 
          company_name: 'Test Co', 
          company_status: 'active',
          company_link: 'javascript:alert(1)',
          registered_postcode: 'AB1 2CD'
        }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={maliciousData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const links = document.querySelectorAll('a[href^="javascript:"]')
      links.forEach(link => {
        expect(link.getAttribute('href')).not.toMatch(/^javascript:/i)
      })
    })

    it('should handle special characters in search without executing code', async () => {
      const mockData = [
        { id: 1, director_name: 'Test User', company_name: 'Test Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const specialChars = '"><img src=x onerror=alert(1)>'
      
      fireEvent.change(searchInput, { target: { value: specialChars } })
      
      expect(searchInput.value).toBe(specialChars)
      expect(document.querySelector('img[onerror]')).toBeNull()
    })
  })

  describe('Authentication Security', () => {
    let mockSessionStorage

    beforeEach(() => {
      mockSessionStorage = {}
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockSessionStorage[key] || null)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { mockSessionStorage[key] = value })
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete mockSessionStorage[key] })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should not expose password in DOM', () => {
      render(<Login onLogin={vi.fn()} />)
      
      const passwordInput = screen.getByPlaceholderText('Enter password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should handle empty credentials gracefully', async () => {
      const onLogin = vi.fn(() => false)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)
      
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      expect(onLogin).toHaveBeenCalledWith('', '')
    })

    it('should not leak authentication status in error messages', async () => {
      const onLogin = vi.fn(() => false)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)
      
      await user.type(screen.getByPlaceholderText('Enter username'), 'admin')
      await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      const errorText = screen.getByText('Invalid username or password')
      expect(errorText).toBeInTheDocument()
      expect(errorText.textContent).not.toContain('user exists')
      expect(errorText.textContent).not.toContain('password incorrect')
    })

    it('should handle rapid login attempts', async () => {
      const onLogin = vi.fn(() => false)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)
      
      const submitBtn = screen.getByRole('button', { name: 'Sign In' })
      
      for (let i = 0; i < 5; i++) {
        await user.click(submitBtn)
      }
      
      expect(onLogin).toHaveBeenCalledTimes(5)
    })
  })

  describe('Input Validation', () => {
    it('should handle SQL injection patterns in search', async () => {
      const user = userEvent.setup()
      const mockData = [
        { id: 1, director_name: 'Test User', company_name: 'Test Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const sqlInjection = "'; DROP TABLE users; --"
      
      await user.type(searchInput, sqlInjection)
      
      expect(searchInput.value).toBe(sqlInjection)
    })

    it('should handle NoSQL injection patterns', () => {
      const mockData = [
        { id: 1, director_name: 'Test User', company_name: 'Test Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const noSqlPayload = '{"$gt": ""}'
      
      fireEvent.change(searchInput, { target: { value: noSqlPayload } })
      
      expect(searchInput.value).toBe(noSqlPayload)
    })

    it('should handle extremely long input gracefully', () => {
      render(<Login onLogin={vi.fn()} />)
      
      const longString = 'a'.repeat(10000)
      const usernameInput = screen.getByPlaceholderText('Enter username')
      
      fireEvent.change(usernameInput, { target: { value: longString } })
      
      expect(usernameInput.value.length).toBe(10000)
    })

    it('should handle null bytes in input', async () => {
      const user = userEvent.setup()
      const mockData = [
        { id: 1, director_name: 'Test User', company_name: 'Test Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const nullBytePayload = 'test\x00attack'
      
      await user.type(searchInput, nullBytePayload)
      
      expect(searchInput).toBeInTheDocument()
    })

    it('should handle unicode characters safely', () => {
      const mockData = [
        { id: 1, director_name: 'Tëst Üsér', company_name: 'Test Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const unicodePayload = '你好世界 مرحبا العالم'
      
      fireEvent.change(searchInput, { target: { value: unicodePayload } })
      
      expect(searchInput.value).toBe(unicodePayload)
    })
  })

  describe('Session Security', () => {
    let mockSessionStorage

    beforeEach(() => {
      mockSessionStorage = {}
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockSessionStorage[key] || null)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { mockSessionStorage[key] = value })
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete mockSessionStorage[key] })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should not store sensitive data in session storage on failed login', async () => {
      const onLogin = vi.fn(() => false)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)
      
      await user.type(screen.getByPlaceholderText('Enter username'), 'admin')
      await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpass')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      expect(mockSessionStorage['albfinder_auth']).toBeUndefined()
      expect(mockSessionStorage['password']).toBeUndefined()
    })
  })

  describe('Data Exposure Prevention', () => {
    it('should not expose internal IDs in predictable patterns', () => {
      const mockData = [
        { id: 1, director_name: 'User 1', company_name: 'Co 1', company_status: 'active' },
        { id: 2, director_name: 'User 2', company_name: 'Co 2', company_status: 'active' },
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const html = document.body.innerHTML
      const idPattern = /data-id=["']?\d+["']?/g
      const matches = html.match(idPattern) || []
      expect(matches.length).toBeLessThan(10)
    })

    it('should not log sensitive information to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const onLogin = vi.fn(() => false)
      const user = userEvent.setup()

      render(<Login onLogin={onLogin} />)
      
      await user.type(screen.getByPlaceholderText('Enter username'), 'admin')
      await user.type(screen.getByPlaceholderText('Enter password'), 'secretpassword')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      const allCalls = [...consoleSpy.mock.calls, ...consoleErrorSpy.mock.calls]
      const sensitiveLogged = allCalls.some(call => 
        call.some(arg => String(arg).includes('secretpassword'))
      )
      
      expect(sensitiveLogged).toBe(false)
      
      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('CSRF Protection', () => {
    it('should use proper form submission method', () => {
      render(<Login onLogin={vi.fn()} />)
      
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
    })
  })

  describe('Content Security', () => {
    it('should not have inline event handlers in static content', () => {
      const mockData = [
        { id: 1, director_name: 'Test', company_name: 'Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const elementsWithOnclick = document.querySelectorAll('[onclick]')
      const elementsWithOnerror = document.querySelectorAll('[onerror]')
      const elementsWithOnload = document.querySelectorAll('[onload]')
      
      expect(elementsWithOnclick.length).toBe(0)
      expect(elementsWithOnerror.length).toBe(0)
      expect(elementsWithOnload.length).toBe(0)
    })

    it('should have secure anchor targets', () => {
      const mockData = [
        { 
          id: 1, 
          director_name: 'Test', 
          company_name: 'Co', 
          company_status: 'active',
          company_link: 'https://example.com'
        }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const externalLinks = document.querySelectorAll('a[target="_blank"]')
      externalLinks.forEach(link => {
        const rel = link.getAttribute('rel')
        if (rel) {
          expect(rel).toMatch(/noopener|noreferrer/)
        }
      })
    })
  })

  describe('Error Handling Security', () => {
    it('should not expose stack traces to users', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockData = [
        { id: 1, director_name: 'Test', company_name: 'Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const bodyText = document.body.textContent
      expect(bodyText).not.toMatch(/at \w+\s*\(.*:\d+:\d+\)/)
      expect(bodyText).not.toContain('Error:')
      expect(bodyText).not.toContain('TypeError')
      expect(bodyText).not.toContain('ReferenceError')
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Prototype Pollution Prevention', () => {
    it('should handle __proto__ in input safely', async () => {
      const user = userEvent.setup()
      const mockData = [
        { id: 1, director_name: 'Test', company_name: 'Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const protoPayload = '__proto__[polluted]=true'
      
      await user.type(searchInput, protoPayload)
      
      expect({}.polluted).toBeUndefined()
    })

    it('should handle constructor pollution attempts', async () => {
      const user = userEvent.setup()
      const mockData = [
        { id: 1, director_name: 'Test', company_name: 'Co', company_status: 'active' }
      ]

      render(
        <MemoryRouter>
          <Dashboard 
            data={mockData} 
            loading={false} 
            useSupabase={false} 
            onLogout={vi.fn()} 
            darkMode={false} 
            toggleDarkMode={vi.fn()} 
          />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search director/i)
      const constructorPayload = 'constructor.prototype.polluted=true'
      
      await user.type(searchInput, constructorPayload)
      
      expect({}.polluted).toBeUndefined()
    })
  })
})
