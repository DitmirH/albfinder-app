import { describe, expect, it } from 'vitest'

// These are inline functions in Dashboard.jsx - testing the logic directly
// In a real refactor, you'd extract these to a utils file

describe('formatEnrichmentDate', () => {
  const DEFAULT_ENRICHMENT_DATE = '04-03-2026'

  function formatEnrichmentDate(date) {
    if (!date || !String(date).trim()) return DEFAULT_ENRICHMENT_DATE
    const s = String(date).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-')
      return `${d}-${m}-${y}`
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s
    return s
  }

  it('returns default date for empty string', () => {
    expect(formatEnrichmentDate('')).toBe(DEFAULT_ENRICHMENT_DATE)
  })

  it('returns default date for null', () => {
    expect(formatEnrichmentDate(null)).toBe(DEFAULT_ENRICHMENT_DATE)
  })

  it('returns default date for undefined', () => {
    expect(formatEnrichmentDate(undefined)).toBe(DEFAULT_ENRICHMENT_DATE)
  })

  it('converts yyyy-mm-dd to dd-mm-yyyy', () => {
    expect(formatEnrichmentDate('2026-03-04')).toBe('04-03-2026')
  })

  it('keeps dd-mm-yyyy format unchanged', () => {
    expect(formatEnrichmentDate('04-03-2026')).toBe('04-03-2026')
  })

  it('returns other formats unchanged', () => {
    expect(formatEnrichmentDate('March 4, 2026')).toBe('March 4, 2026')
  })
})

describe('parseFinancial', () => {
  function parseFinancial(val) {
    if (val == null) return null
    if (typeof val === 'number' && !isNaN(val)) return val
    const s = String(val).replace(/[£,\s]/g, '')
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  it('returns null for null input', () => {
    expect(parseFinancial(null)).toBe(null)
  })

  it('returns null for undefined input', () => {
    expect(parseFinancial(undefined)).toBe(null)
  })

  it('returns number as-is', () => {
    expect(parseFinancial(12345)).toBe(12345)
  })

  it('parses string with pound sign', () => {
    expect(parseFinancial('£100,000')).toBe(100000)
  })

  it('parses string with commas', () => {
    expect(parseFinancial('1,234,567')).toBe(1234567)
  })

  it('parses negative values', () => {
    expect(parseFinancial('-£50,000')).toBe(-50000)
  })

  it('parses decimal values', () => {
    expect(parseFinancial('£123.45')).toBe(123.45)
  })

  it('returns null for non-numeric string', () => {
    expect(parseFinancial('N/A')).toBe(null)
  })

  it('handles spaces', () => {
    expect(parseFinancial(' £100 ')).toBe(100)
  })
})

describe('fmtCurrency', () => {
  function fmtCurrency(val) {
    if (val == null || isNaN(val)) return '—'
    const abs = Math.abs(val)
    const formatted = abs >= 1000 ? `£${abs.toLocaleString('en-GB')}` : `£${abs}`
    return val < 0 ? `-${formatted}` : formatted
  }

  it('returns dash for null', () => {
    expect(fmtCurrency(null)).toBe('—')
  })

  it('returns dash for NaN', () => {
    expect(fmtCurrency(NaN)).toBe('—')
  })

  it('formats positive number', () => {
    expect(fmtCurrency(100000)).toBe('£100,000')
  })

  it('formats negative number', () => {
    expect(fmtCurrency(-50000)).toBe('-£50,000')
  })

  it('formats small numbers without commas', () => {
    expect(fmtCurrency(500)).toBe('£500')
  })

  it('formats zero', () => {
    expect(fmtCurrency(0)).toBe('£0')
  })
})

describe('useDebounce logic', () => {
  it('debounce concept - value updates after delay', async () => {
    let value = 'initial'
    const delay = 50

    // Simulate debounce
    const debounce = (fn, ms) => {
      let timer
      return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), ms)
      }
    }

    const update = debounce((v) => { value = v }, delay)
    
    update('test1')
    expect(value).toBe('initial') // Not updated yet
    
    await new Promise(r => setTimeout(r, delay + 10))
    expect(value).toBe('test1') // Updated after delay
  })
})
