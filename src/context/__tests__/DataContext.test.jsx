import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DataProvider, useData, useDataOptional } from '../DataContext'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

function TestConsumer() {
  const ctx = useData()
  return (
    <div>
      <span data-testid="loading">{ctx.loading ? 'true' : 'false'}</span>
      <span data-testid="total-count">{ctx.totalCount}</span>
      <span data-testid="records-length">{ctx.records.length}</span>
      <span data-testid="initial-load-done">{ctx.initialLoadDone ? 'true' : 'false'}</span>
      <button onClick={() => ctx.loadFilters()}>Load Filters</button>
      <button onClick={() => ctx.loadStats()}>Load Stats</button>
      <button onClick={() => ctx.loadPage({ page: 1, pageSize: 10 })}>Load Page</button>
    </div>
  )
}

function OptionalConsumer() {
  const ctx = useDataOptional()
  return <span data-testid="optional-ctx">{ctx ? 'has context' : 'no context'}</span>
}

describe('DataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DataProvider', () => {
    it('provides initial state', () => {
      render(
        <DataProvider>
          <TestConsumer />
        </DataProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('total-count')).toHaveTextContent('0')
      expect(screen.getByTestId('records-length')).toHaveTextContent('0')
      expect(screen.getByTestId('initial-load-done')).toHaveTextContent('false')
    })

    it('exposes loadFilters function', async () => {
      const { supabase } = await import('../../lib/supabase')
      supabase.rpc.mockResolvedValueOnce({
        data: { nationalities: ['Albanian', 'British'], grades: ['A', 'B'], statuses: ['active'] },
        error: null,
      })

      render(
        <DataProvider>
          <TestConsumer />
        </DataProvider>
      )

      await act(async () => {
        screen.getByText('Load Filters').click()
      })

      expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_filters')
    })

    it('exposes loadStats function', async () => {
      const { supabase } = await import('../../lib/supabase')
      supabase.rpc.mockResolvedValueOnce({
        data: { totalCount: 100, enrichedCount: 50, lastEnriched: '2026-03-04', uniqueCompanies: 80, uniqueDirectors: 90 },
        error: null,
      })

      render(
        <DataProvider>
          <TestConsumer />
        </DataProvider>
      )

      await act(async () => {
        screen.getByText('Load Stats').click()
      })

      expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_stats')
    })

    it('exposes loadPage function', async () => {
      const { supabase } = await import('../../lib/supabase')
      supabase.rpc.mockResolvedValueOnce({
        data: { totalCount: 100, rows: [{ id: 1, director_name: 'Test' }] },
        error: null,
      })

      render(
        <DataProvider>
          <TestConsumer />
        </DataProvider>
      )

      await act(async () => {
        screen.getByText('Load Page').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('records-length')).toHaveTextContent('1')
      })
    })
  })

  describe('useData', () => {
    it('throws error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useData must be used within DataProvider')
      
      consoleError.mockRestore()
    })
  })

  describe('useDataOptional', () => {
    it('returns null when used outside provider', () => {
      render(<OptionalConsumer />)
      expect(screen.getByTestId('optional-ctx')).toHaveTextContent('no context')
    })

    it('returns context when used inside provider', () => {
      render(
        <DataProvider>
          <OptionalConsumer />
        </DataProvider>
      )
      expect(screen.getByTestId('optional-ctx')).toHaveTextContent('has context')
    })
  })
})
