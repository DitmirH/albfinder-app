/**
 * Seed Supabase `records` table from public/data.json
 * Run: node scripts/seed-supabase.js
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) in env, or .env
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pathToJson = join(__dirname, '..', 'public', 'data.json')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in .env')
  process.exit(1)
}

const supabase = createClient(url, key)

/** Remove null bytes and other chars PostgreSQL text doesn't allow */
function sanitizeForPostgres(val) {
  if (val == null) return val
  if (typeof val === 'string') {
    return val.replace(/\u0000/g, '')
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeForPostgres)
  }
  if (typeof val === 'object') {
    const out = {}
    for (const k of Object.keys(val)) {
      out[k] = sanitizeForPostgres(val[k])
    }
    return out
  }
  return val
}

async function main() {
  console.log('Reading public/data.json...')
  const raw = readFileSync(pathToJson, 'utf-8')
  const records = JSON.parse(raw)
  if (!Array.isArray(records) || records.length === 0) {
    console.error('No records in JSON')
    process.exit(1)
  }

  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH).map(sanitizeForPostgres)
    const { error } = await supabase.from('records').upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error('Batch error:', error)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`Upserted ${inserted}/${records.length}`)
  }
  console.log('Done. Total rows:', inserted)
}

main()
