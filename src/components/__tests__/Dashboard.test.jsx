import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../context/DataContext', () => ({
  useDataOptional: () => null,
}))

const sampleData = [
  {
    id: 1,
    director_name: 'John Smith',
    company_name: 'ACME Ltd',
    company_number: '12345678',
    company_type: 'ltd',
    company_status: 'active',
    nationality: 'British',
    registered_postcode: 'SW1A 1AA',
    financial_health_grade: 'A',
    financial_health_score: '85',
    current_assets: '£100,000',
    data_enrichment_last: '04-03-2026',
  },
  {
    id: 2,
    director_name: 'Jane Doe',
    company_name: 'Beta Corp',
    company_number: '87654321',
    company_type: 'plc',
    company_status: 'dissolved',
    nationality: 'Albanian',
    registered_postcode: 'EC1A 1BB',
    financial_health_grade: 'C',
    financial_health_score: '55',
    current_assets: '£50,000',
    data_enrichment_last: '03-03-2026',
  },
  {
    id: 3,
    director_name: 'Bob Wilson',
    company_name: 'Gamma Inc',
    company_number: '11111111',
    company_type: 'ltd',
    company_status: 'active',
    nationality: 'Albanian',
    registered_postcode: 'M1 1AA',
    financial_health_grade: 'B',
    financial_health_score: '70',
    current_assets: '£200,000',
    data_enrichment_last: '',
  },
]

const renderDashboard = (props = {}) => {
  const defaultProps = {
    data: sampleData,
    loading: false,
    useSupabase: false,
    onLogout: vi.fn(),
    darkMode: false,
    toggleDarkMode: vi.fn(),
    ...props,
  }
  return render(
    <BrowserRouter>
      <Dashboard {...defaultProps} />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('rendering', () => {
    it('shows loading state when loading is true', () => {
      renderDashboard({ loading: true })
      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })

    it('renders dashboard when data is loaded', () => {
      renderDashboard()
      expect(screen.getByText('AlbFinder')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Search director/i)).toBeInTheDocument()
    })

    it('displays records in table', () => {
      renderDashboard()
      const johnSmithElements = screen.getAllByText('John Smith')
      expect(johnSmithElements.length).toBeGreaterThan(0)
      const janeDoeElements = screen.getAllByText('Jane Doe')
      expect(janeDoeElements.length).toBeGreaterThan(0)
      const bobWilsonElements = screen.getAllByText('Bob Wilson')
      expect(bobWilsonElements.length).toBeGreaterThan(0)
    })

    it('displays company names', () => {
      renderDashboard()
      const acmeElements = screen.getAllByText('ACME Ltd')
      expect(acmeElements.length).toBeGreaterThan(0)
      const betaElements = screen.getAllByText('Beta Corp')
      expect(betaElements.length).toBeGreaterThan(0)
    })

    it('does not show nationality column in table', () => {
      renderDashboard()
      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent)
      expect(headerTexts.some(t => t.includes('Nationality'))).toBe(false)
    })
  })

  describe('search functionality', () => {
    it('filters records by director name', async () => {
      const user = userEvent.setup()
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText(/Search director/i)
      await user.type(searchInput, 'John')
      
      await waitFor(() => {
        const johnElements = screen.getAllByText('John Smith')
        expect(johnElements.length).toBeGreaterThan(0)
      })
    })

    it('filters records by company name', async () => {
      const user = userEvent.setup()
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText(/Search director/i)
      await user.type(searchInput, 'ACME')
      
      await waitFor(() => {
        const acmeElements = screen.getAllByText('ACME Ltd')
        expect(acmeElements.length).toBeGreaterThan(0)
      })
    })

    it('clears search when X button is clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText(/Search director/i)
      await user.type(searchInput, 'test')
      
      const clearButton = searchInput.parentElement.querySelector('button')
      await user.click(clearButton)
      
      expect(searchInput).toHaveValue('')
    })
  })

  describe('navigation', () => {
    it('navigates to director detail page when table row is clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()
      
      const row = screen.getByRole('table').querySelector('tbody tr')
      await user.click(row)
      
      expect(mockNavigate).toHaveBeenCalledWith('/director/1')
    })

    it('calls onLogout when logout button is clicked', async () => {
      const onLogout = vi.fn()
      const user = userEvent.setup()
      renderDashboard({ onLogout })
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      expect(onLogout).toHaveBeenCalled()
    })
  })

  describe('dark mode toggle', () => {
    it('calls toggleDarkMode when toggle button is clicked', async () => {
      const toggleDarkMode = vi.fn()
      const user = userEvent.setup()
      renderDashboard({ toggleDarkMode })
      
      const toggleButton = screen.getByTitle(/mode/i)
      await user.click(toggleButton)
      
      expect(toggleDarkMode).toHaveBeenCalled()
    })
  })

  describe('filters', () => {
    it('shows filter panel when Filters button is clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()
      
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)
      
      expect(screen.getByText('All Nationalities')).toBeInTheDocument()
      expect(screen.getByText('All Grades')).toBeInTheDocument()
      expect(screen.getByText('All Statuses')).toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('shows result count', () => {
      renderDashboard()
      expect(screen.getByText(/1–3/)).toBeInTheDocument()
    })

    it('allows changing page size', async () => {
      const user = userEvent.setup()
      renderDashboard()
      
      const selects = screen.getAllByRole('combobox')
      const pageSizeSelect = selects[selects.length - 1]
      await user.selectOptions(pageSizeSelect, '25')
      
      expect(pageSizeSelect).toHaveValue('25')
    })
  })

  describe('view toggle', () => {
    it('defaults to table view on desktop', () => {
      renderDashboard()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })
})
