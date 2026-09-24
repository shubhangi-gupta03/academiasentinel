/**
 * AcademiaSentinel — OSINT Scanner
 * Sources: HaveIBeenPwned API + Google CSE paste site search
 * Triggered via Netlify scheduled function (cron) OR admin-only manual trigger.
 * Requires: aicte_admin role for manual trigger; cron fires without auth check.
 */
import { createClient } from '@supabase/supabase-js'
import { requireAuth, safeError, isValidDomain, sanitizeUrl } from './_auth.js'

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || 'https://academiasentinel.netlify.app'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const VALID_THREAT_TYPES = new Set(['EXAM_LEAK','CREDENTIAL_DUMP','RANSOMWARE','FAKE_DOCUMENT','RESEARCH_THEFT','DATA_BREACH','PHISHING','GENERAL_THREAT'])
const VALID_SEVERITIES = new Set(['CRITICAL','HIGH','MEDIUM','LOW'])

function classifyThreat(text) {
  const t = (text || '').toLowerCase()
  if (/exam|paper|question|shift|jee|neet|gate|cbse|upsc/.test(t)) return 'EXAM_LEAK'
  if (/password|credential|login|dump|combo|plaintext|hash/.test(t)) return 'CREDENTIAL_DUMP'
  if (/ransomware|encrypt|ransom|decrypt|lockbit|ryuk|medusa/.test(t)) return 'RANSOMWARE'
  if (/degree|certificate|marksheet|hologram|fake|forged/.test(t)) return 'FAKE_DOCUMENT'
  if (/research|thesis|patent|paper stolen|ip theft|plagiarism/.test(t)) return 'RESEARCH_THEFT'
  if (/aadhaar|pan|pii|personal data|student record|admission data/.test(t)) return 'DATA_BREACH'
  if (/phishing|fake portal|fake website|scholarship scam/.test(t)) return 'PHISHING'
  return 'GENERAL_THREAT'
}

function severityFromType(type) {
  return { RANSOMWARE:'CRITICAL', CREDENTIAL_DUMP:'HIGH', DATA_BREACH:'HIGH', EXAM_LEAK:'HIGH', RESEARCH_THEFT:'MEDIUM', FAKE_DOCUMENT:'MEDIUM', PHISHING:'MEDIUM', GENERAL_THREAT:'LOW' }[type] || 'LOW'
}

async function checkHIBP(domain) {
  if (!process.env.HIBP_API_KEY || !isValidDomain(domain)) return []
  try {
    const res = await fetch(`https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`, {
      headers: { 'hibp-api-key': process.env.HIBP_API_KEY, 'User-Agent': 'AcademiaSentinel-SIH2026' },
      signal: AbortSignal.timeout(5000)
    })
    if (res.status === 404 || !res.ok) return []
    return await res.json()
  } catch { return [] }
}

async function scanPasteSites(domain, instName) {
  if (!process.env.GOOGLE_CSE_KEY || !process.env.GOOGLE_CSE_ID || !isValidDomain(domain)) return []
  const results = []
  try {
    // Domain is validated above; still encode it for URL safety
    const query = encodeURIComponent(`"${domain}" (leak OR dump OR breach OR hack OR credential OR password)`)
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${query}&num=3&siteSearch=pastebin.com,paste.ee,ghostbin.com`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    for (const item of (data.items || [])) {
      const threatType = classifyThreat(`${item.title} ${item.snippet}`)
      const rawUrl = item.link || ''
      const safeSourceUrl = sanitizeUrl(rawUrl) // only allow https://

      results.push({
        institution_domain: domain,
        institution_name: instName?.slice(0, 200) || domain,
        threat_type: VALID_THREAT_TYPES.has(threatType) ? threatType : 'GENERAL_THREAT',
        severity: severityFromType(threatType),
        source: 'PASTE_SITE',
        source_url: safeSourceUrl,
        title: `Paste site: ${(item.title || '').replace(/[<>"']/g, '').slice(0, 120)}`,
        description: (item.snippet || '').replace(/[<>"']/g, '').slice(0, 400),
        raw_data: null, // Don't store search query to avoid leaking CSE details
        detected_at: new Date().toISOString()
      })
    }
  } catch (e) { console.warn('[scan] CSE error:', e.message) }
  return results
}

async function updateRiskScore(domain) {
  if (!isValidDomain(domain)) return null
  const { data: alerts } = await supabase
    .from('threat_alerts')
    .select('severity, detected_at')
    .eq('institution_domain', domain)
    .gte('detected_at', new Date(Date.now() - 30 * 86400000).toISOString())

  let score = 100
  for (const a of (alerts || [])) {
    const daysAgo = (Date.now() - new Date(a.detected_at)) / 86400000
    const recencyWeight = Math.max(0.3, 1 - daysAgo / 30)
    if (a.severity === 'CRITICAL') score -= 30 * recencyWeight
    else if (a.severity === 'HIGH') score -= 18 * recencyWeight
    else if (a.severity === 'MEDIUM') score -= 8 * recencyWeight
    else score -= 3 * recencyWeight
  }
  score = Math.max(0, Math.round(score))
  await supabase.from('institutions').update({ risk_score: score, last_scanned: new Date().toISOString() }).eq('domain', domain)
  return score
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'X-Content-Type-Options': 'nosniff'
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  // Scheduled invocations come from Netlify with no auth header — allow them.
  // Manual triggers from UI require aicte_admin.
  const isScheduled = event.headers?.['x-netlify-scheduled'] === 'true'
  if (!isScheduled) {
    const auth = await requireAuth(event, ['aicte_admin'])
    if (auth.response) return { ...auth.response, headers }
  }

  const startTime = Date.now()
  try {
    const { data: institutions, error: instErr } = await supabase
      .from('institutions')
      .select('domain, name')
      .order('risk_score', { ascending: true })

    if (instErr) throw instErr
    if (!institutions?.length) return { statusCode: 200, headers, body: JSON.stringify({ message: 'No institutions in DB' }) }

    // Filter to valid domains only before making any external requests
    const validInstitutions = institutions.filter(i => isValidDomain(i.domain))
    const allAlerts = []

    for (let i = 0; i < validInstitutions.length; i += 4) {
      const batch = validInstitutions.slice(i, i + 4)
      const batchResults = await Promise.all(batch.flatMap(inst => [
        checkHIBP(inst.domain).then(breaches => breaches.map(b => ({
          institution_domain: inst.domain,
          institution_name: inst.name,
          threat_type: 'CREDENTIAL_DUMP',
          severity: 'HIGH',
          source: 'HIBP',
          source_url: sanitizeUrl(`https://haveibeenpwned.com/domain/${encodeURIComponent(inst.domain)}`),
          title: `HIBP breach: ${typeof b === 'object' ? String(b.Name || '').slice(0, 100) : 'Unknown'}`,
          description: typeof b === 'object'
            ? `Breach "${String(b.Name || '').slice(0, 50)}" on ${b.BreachDate || 'unknown date'}. Affected: ${Array.isArray(b.DataClasses) ? b.DataClasses.slice(0,5).join(', ') : ''}`.slice(0, 400)
            : 'Domain found in breach database',
          raw_data: null,
          detected_at: (typeof b === 'object' && b.BreachDate) ? new Date(b.BreachDate).toISOString() : new Date().toISOString()
        }))),
        scanPasteSites(inst.domain, inst.name)
      ]))
      allAlerts.push(...batchResults.flat())
    }

    let inserted = 0
    if (allAlerts.length > 0) {
      // Final validation pass before DB insert
      const cleanAlerts = allAlerts
        .filter(a => isValidDomain(a.institution_domain))
        .filter(a => VALID_THREAT_TYPES.has(a.threat_type))
        .filter(a => VALID_SEVERITIES.has(a.severity))

      const { error, count } = await supabase
        .from('threat_alerts')
        .upsert(cleanAlerts, { onConflict: 'source_url,institution_domain', ignoreDuplicates: true, count: 'exact' })
      if (error) console.error('[scan] upsert error:', error.code) // log code only, not full error
      inserted = count || 0
    }

    await Promise.all(validInstitutions.map(i => updateRiskScore(i.domain)))

    await supabase.from('scan_logs').insert({
      domains_scanned: validInstitutions.length,
      alerts_found: allAlerts.length,
      scan_duration_ms: Date.now() - startTime
    })

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        institutions_scanned: validInstitutions.length,
        alerts_found: allAlerts.length,
        alerts_inserted: inserted,
        duration_ms: Date.now() - startTime
      })
    }
  } catch (err) {
    return { ...safeError(err), headers }
  }
}
