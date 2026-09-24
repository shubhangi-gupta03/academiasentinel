/**
 * Authenticated fetch wrapper — automatically attaches Supabase JWT.
 * Use instead of raw fetch() for all /api/* calls.
 */
import { supabase } from './supabase'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  }
}

export async function apiFetch(path, options = {}) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) }
  })
  if (res.status === 401) throw new Error('SESSION_EXPIRED')
  if (res.status === 403) throw new Error('FORBIDDEN')
  return res
}
