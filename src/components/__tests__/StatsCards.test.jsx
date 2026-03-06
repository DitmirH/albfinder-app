import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatsCards from '../StatsCards'

describe('StatsCards', () => {
  describe('static data mode', () => {
    it('calculates stats from static data when api stats are not provided', () => {
      const data = [
        { company_number: 'A1', director_name: 'Dir 1', data_enrichment_last: '04-03-2026' },
        { company_number: 'A1', director_name: 'Dir 2', data_enrichment_last: '' },
        { company_number: 'B2', director_name: 'Dir 1', data_enrichment_last: '03-03-2026' },
      ]

      render(<StatsCards data={data} />)

      expect(screen.getByText('Total Records')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
      expect(screen.getByText('Directors')).toBeInTheDocument()
      expect(screen.getByText('Enriched')).toBeInTheDocument()

      expect(screen.getByText('Total Records').previousElementSibling).toHaveTextContent('3')
      expect(screen.getByText('Companies').previousElementSibling).toHaveTextContent('2')
      expect(screen.getByText('Directors').previousElementSibling).toHaveTextContent('2')
      expect(screen.getByText('Enriched').previousElementSibling).toHaveTextContent('2')
    })

    it('handles empty data array', () => {
      render(<StatsCards data={[]} />)

      expect(screen.getByText('Total Records').previousElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Companies').previousElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Directors').previousElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Enriched').previousElementSibling).toHaveTextContent('0')
    })

    it('counts unique companies correctly', () => {
      const data = [
        { company_number: 'A1', director_name: 'Dir 1' },
        { company_number: 'A1', director_name: 'Dir 2' },
        { company_number: 'A1', director_name: 'Dir 3' },
        { company_number: 'B2', director_name: 'Dir 4' },
      ]

      render(<StatsCards data={data} />)

      expect(screen.getByText('Total Records').previousElementSibling).toHaveTextContent('4')
      expect(screen.getByText('Companies').previousElementSibling).toHaveTextContent('2')
    })

    it('counts unique directors correctly', () => {
      const data = [
        { company_number: 'A1', director_name: 'John Smith' },
        { company_number: 'B2', director_name: 'John Smith' },
        { company_number: 'C3', director_name: 'Jane Doe' },
      ]

      render(<StatsCards data={data} />)

      expect(screen.getByText('Directors').previousElementSibling).toHaveTextContent('2')
    })

    it('counts enriched records correctly', () => {
      const data = [
        { company_number: 'A1', director_name: 'Dir 1', data_enrichment_last: '04-03-2026' },
        { company_number: 'B2', director_name: 'Dir 2', data_enrichment_last: '' },
        { company_number: 'C3', director_name: 'Dir 3', data_enrichment_last: null },
        { company_number: 'D4', director_name: 'Dir 4', data_enrichment_last: '03-03-2026' },
      ]

      render(<StatsCards data={data} />)

      expect(screen.getByText('Enriched').previousElementSibling).toHaveTextContent('2')
    })
  })

  describe('API stats mode', () => {
    it('uses provided api stats when available', () => {
      const stats = {
        totalCount: 19327,
        uniqueCompanies: 8200,
        uniqueDirectors: 9100,
        enrichedCount: 12000,
      }

      render(<StatsCards data={[]} stats={stats} />)

      expect(screen.getByText('19,327')).toBeInTheDocument()
      expect(screen.getByText('8,200')).toBeInTheDocument()
      expect(screen.getByText('9,100')).toBeInTheDocument()
      expect(screen.getByText('12,000')).toBeInTheDocument()
    })

    it('handles zero values in api stats', () => {
      const stats = {
        totalCount: 0,
        uniqueCompanies: 0,
        uniqueDirectors: 0,
        enrichedCount: 0,
      }

      render(<StatsCards data={[]} stats={stats} />)

      expect(screen.getAllByText('0')).toHaveLength(4)
    })

    it('formats large numbers with commas', () => {
      const stats = {
        totalCount: 1234567,
        uniqueCompanies: 987654,
        uniqueDirectors: 123456,
        enrichedCount: 654321,
      }

      render(<StatsCards data={[]} stats={stats} />)

      expect(screen.getByText('1,234,567')).toBeInTheDocument()
      expect(screen.getByText('987,654')).toBeInTheDocument()
      expect(screen.getByText('123,456')).toBeInTheDocument()
      expect(screen.getByText('654,321')).toBeInTheDocument()
    })

    it('handles null values in api stats gracefully', () => {
      const stats = {
        totalCount: null,
        uniqueCompanies: null,
        uniqueDirectors: null,
        enrichedCount: null,
      }

      render(<StatsCards data={[]} stats={stats} />)

      expect(screen.getAllByText('0')).toHaveLength(4)
    })
  })

  describe('rendering', () => {
    it('renders four stat cards', () => {
      render(<StatsCards data={[]} />)

      const cards = screen.getAllByText(/Records|Companies|Directors|Enriched/)
      expect(cards).toHaveLength(4)
    })

    it('renders with correct labels', () => {
      render(<StatsCards data={[]} />)

      expect(screen.getByText('Total Records')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
      expect(screen.getByText('Directors')).toBeInTheDocument()
      expect(screen.getByText('Enriched')).toBeInTheDocument()
    })
  })
})
