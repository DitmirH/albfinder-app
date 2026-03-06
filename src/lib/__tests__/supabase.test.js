import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('supabase client', () => {
  const originalEnv = { ...import.meta.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv)
  })

  it('exports isSupabaseConfigured function', async () => {
    const { isSupabaseConfigured } = await import('../supabase')
    expect(typeof isSupabaseConfigured).toBe('function')
  })

  it('returns false when env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()
    const { isSupabaseConfigured } = await import('../supabase')
    expect(isSupabaseConfigured()).toBe(false)
  })
})
