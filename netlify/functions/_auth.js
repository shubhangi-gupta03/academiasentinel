/**
 * AcademiaSentinel — Shared Auth Middleware
 * Validates Supabase JWT on every API call.
 * Usage: const { user, error } = await requireAuth(event, ['aicte_admin', 'cert_in'])
 */
import { createClient } from '@supabase/supabase-js'

// Anon client — ONLY for verifying user JWTs (respects RLS)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const ROLE_HIERARCHY = { aicte_admin: 4, cert_in: 3, institution: 2, viewer: 1 }

/**
 * @param {object} event - Netlify function event
 * @param {string[]} allowedRoles - roles permitted (empty = any authenticated user)
 * @returns {{ user, role, error, response }} — response is set if auth failed
 */
export async function requireAuth(event, allowedRoles = []) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return {
      error: 'Missing token',
      response: { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
    if (error || !user) {
      return {
        error: 'Invalid token',
        response: { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) }
      }
    }

    const role = user.user_metadata?.role || 'viewer'

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return {
        error: 'Forbidden',
        response: { statusCode: 403, body: JSON.stringify({ error: 'Insufficient permissions', required: allowedRoles, your_role: role }) }
      }
    }

    return { user, role }
  } catch (e) {
    console.error('[auth] verification failed:', e.message)
    return {
      error: 'Auth error',
      response: { statusCode: 500, body: JSON.stringify({ error: 'Authentication service unavailable' }) }
    }
  }
}

/**
 * Rate limiting via Supabase — stores call counts per IP
 * Lightweight, no Redis required.
 * @param {string} key - rate limit key (e.g. 'classify:1.2.3.4')
 * @param {number} maxPerMinute
 * @param {object} supabaseServiceClient - service role client for ratelimit table
 */
export async function checkRateLimit(key, maxPerMinute, supabaseServiceClient) {
  try {
    const window = Math.floor(Date.now() / 60000) // 1-minute window
    const rlKey = `${key}:${window}`

    const { data, error } = await supabaseServiceClient
      .from('rate_limits')
      .select('count')
      .eq('key', rlKey)
      .single()

    if (error && error.code !== 'PGRST116') return { allowed: true } // fail open on DB error

    const count = data?.count || 0
    if (count >= maxPerMinute) {
      return { allowed: false, count, limit: maxPerMinute }
    }

    // Upsert count
    await supabaseServiceClient
      .from('rate_limits')
      .upsert({ key: rlKey, count: count + 1, expires_at: new Date(Date.now() + 120000).toISOString() },
        { onConflict: 'key' })

    return { allowed: true, count: count + 1 }
  } catch (e) {
    console.warn('[rate-limit] check failed:', e.message)
    return { allowed: true } // fail open
  }
}

/**
 * Sanitize error before sending to client — never leak internals
 */
export function safeError(err, statusCode = 500) {
  console.error('[error]', err?.message || err)
  return {
    statusCode,
    body: JSON.stringify({ error: 'An internal error occurred. Please try again.' })
  }
}

/**
 * Validate domain format
 */
export function isValidDomain(domain) {
  return /^[a-z0-9][a-z0-9\-.]{0,253}\.[a-z]{2,10}$/i.test(domain) &&
    !/(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(domain)
}

/**
 * Safe URL — only allow https://
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' ? url : null
  } catch { return null }
}
