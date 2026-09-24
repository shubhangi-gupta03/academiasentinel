/**
 * AcademiaSentinel — Institutions API
 * GET /api/institutions
 * Requires: authenticated user (any role)
 */
import { createClient } from '@supabase/supabase-js'
import { requireAuth, safeError } from './_auth.js'

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || 'https://academiasentinel.netlify.app'
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

  const auth = await requireAuth(event)
  if (auth.response) return { ...auth.response, headers }

  try {
    // Only expose non-sensitive columns
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, domain, state, type, naac_grade, student_count, risk_score, last_scanned')
      .order('risk_score', { ascending: true })

    if (error) throw error
    return { statusCode: 200, headers, body: JSON.stringify(data || []) }
  } catch (err) {
    return { ...safeError(err), headers }
  }
}
