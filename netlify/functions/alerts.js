/**
 * AcademiaSentinel — Alerts API
 * GET /api/alerts?severity=HIGH&threat_type=EXAM_LEAK&domain=x&limit=50
 * Requires: authenticated user (any role)
 */
import { createClient } from '@supabase/supabase-js'
import { requireAuth, safeError } from './_auth.js'

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || 'https://academiasentinel.netlify.app'
const VALID_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
const VALID_THREAT_TYPES = new Set(['EXAM_LEAK','CREDENTIAL_DUMP','RANSOMWARE','FAKE_DOCUMENT','RESEARCH_THEFT','DATA_BREACH','PHISHING','GENERAL_THREAT'])

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'X-Content-Type-Options': 'nosniff'
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  // Authenticate
  const auth = await requireAuth(event)
  if (auth.response) return { ...auth.response, headers }

  try {
    const params = event.queryStringParameters || {}

    // Validate + sanitize inputs
    const rawLimit = parseInt(params.limit) || 50
    const limit = Math.min(Math.max(rawLimit, 1), 100) // hard cap at 100

    const severity = VALID_SEVERITIES.has(params.severity) ? params.severity : null
    const threat_type = VALID_THREAT_TYPES.has(params.threat_type) ? params.threat_type : null

    // domain: only alphanumeric + dots + hyphens, max 253 chars
    const domainRaw = params.domain || ''
    const domain = /^[a-z0-9][a-z0-9\-.]{0,252}$/i.test(domainRaw) ? domainRaw : null

    let query = supabase
      .from('threat_alerts')
      .select('id, institution_domain, institution_name, threat_type, severity, source, source_url, title, description, status, detected_at, cert_in_reported')
      .order('detected_at', { ascending: false })
      .limit(limit)

    if (severity) query = query.eq('severity', severity)
    if (threat_type) query = query.eq('threat_type', threat_type)
    if (domain) query = query.eq('institution_domain', domain)

    const { data, error } = await query
    if (error) throw error

    return { statusCode: 200, headers, body: JSON.stringify(data || []) }
  } catch (err) {
    return { ...safeError(err), headers }
  }
}
