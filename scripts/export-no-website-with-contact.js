/**
 * Export businesses that have NO website but DO have at least one of:
 * mobile number, email, or social media.
 * Output: businesses-no-website-with-contact.csv in project root.
 *
 * Run: node scripts/export-no-website-with-contact.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pathToJson = join(__dirname, '..', 'public', 'data.json')
const pathToCsv = join(__dirname, '..', 'businesses-no-website-with-contact.csv')

function hasWebsite(record) {
  let ai = record.ai_input
  if (typeof ai === 'string') {
    try {
      ai = JSON.parse(ai)
    } catch {
      ai = null
    }
  }
  const aiWebsite = ai?.website && String(ai.website).trim()
  const kpWebsite = record.google_kp?.website && String(record.google_kp.website).trim()
  return !!(aiWebsite || kpWebsite)
}

function hasContact(record) {
  let ai = record.ai_input
  if (typeof ai === 'string') {
    try {
      ai = JSON.parse(ai)
    } catch {
      ai = null
    }
  }
  const hasPhones = ai?.phones?.length > 0
  const hasEmails = ai?.emails?.length > 0
  const social = ai?.social_media && typeof ai.social_media === 'object'
  const hasSocial = social && Object.values(ai.social_media).some((v) => v && String(v).trim())
  const kp = record.google_kp
  const kpPhone = kp?.phone && String(kp.phone).trim()
  const kpSocial =
    kp &&
    [kp.social_facebook, kp.social_instagram, kp.social_linkedin, kp.social_twitter].some(
      (v) => v && String(v).trim()
    )
  return !!(hasPhones || hasEmails || hasSocial || kpPhone || kpSocial)
}

function escapeCsv(val) {
  if (val == null) return ''
  const s = String(val).trim()
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function rowToCsv(record) {
  let ai = record.ai_input
  if (typeof ai === 'string') {
    try {
      ai = JSON.parse(ai)
    } catch {
      ai = {}
    }
  } else if (!ai) {
    ai = {}
  }
  const social = ai.social_media || {}
  const kp = record.google_kp || {}
  return [
    record.id,
    escapeCsv(record.director_name),
    escapeCsv(record.company_name),
    escapeCsv(record.company_number),
    escapeCsv(record.registered_address),
    escapeCsv(record.registered_postcode),
    escapeCsv(record.nationality),
    escapeCsv(record.company_status),
    escapeCsv((ai.emails || []).join('; ')),
    escapeCsv((ai.phones || []).join('; ')),
    escapeCsv(kp.phone),
    escapeCsv(social.facebook),
    escapeCsv(social.instagram),
    escapeCsv(social.linkedin),
    escapeCsv(social.twitter),
    escapeCsv(social.tiktok),
    escapeCsv(kp.social_facebook),
    escapeCsv(kp.social_instagram),
    escapeCsv(kp.social_linkedin),
    escapeCsv(kp.social_twitter),
  ].join(',')
}

const data = JSON.parse(readFileSync(pathToJson, 'utf8'))
const records = Array.isArray(data) ? data : []

const filtered = records.filter((r) => !hasWebsite(r) && hasContact(r))

const header =
  'id,director_name,company_name,company_number,registered_address,registered_postcode,nationality,company_status,emails,phones,google_kp_phone,social_facebook,social_instagram,social_linkedin,social_twitter,social_tiktok,google_kp_facebook,google_kp_instagram,google_kp_linkedin,google_kp_twitter'
const csv = [header, ...filtered.map(rowToCsv)].join('\n')
writeFileSync(pathToCsv, csv, 'utf8')

console.log(`Total records: ${records.length}`)
console.log(`No website but have contact (phone/email/social): ${filtered.length}`)
console.log(`Written: ${pathToCsv}`)
