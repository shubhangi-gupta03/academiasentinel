/**
 * AcademiaSentinel — Telegram Channel Monitor
 * Monitors public Indian cybersecurity Telegram channels via RSSHub RSS bridge
 * Scheduled every 30 minutes via netlify.toml cron
 * No auth needed for scheduled invocation; admin-only for manual trigger.
 */
import { createClient } from '@supabase/supabase-js'
import { requireAuth, safeError, sanitizeUrl } from './_auth.js'

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || 'https://academiasentinel.netlify.app'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const TELEGRAM_CHANNELS = [
  { username: 'cyberdost', name: 'Cyber Dost (MHA)' },
  { username: 'thecyberexpress', name: 'The Cyber Express' },
  { username: 'certindia', name: 'CERT-In India' },
  { username: 'cyberpeacefoundation', name: 'CyberPeace India' },
  { username: 'indiancybercrime', name: 'Indian Cyber Crime Coordination' }
]

const THREAT_KEYWORDS = {
  EXAM_LEAK: /exam|paper|question|jee|neet|gate|cbse|upsc|leak/i,
  CREDENTIAL_DUMP: /password|credential|login|dump|breach|hack/i,
  RANSOMWARE: /ransomware|ransom|encrypt|decrypt|lockbit|medusa/i,
  DATA_BREACH: /aadhaar|pan card|pii|data breach|student record|personal data/i,
  PHISHING: /phishing|fake website|fake portal|scam|fraud/i,
  FAKE_DOCUMENT: /fake degree|fake certificate|marksheet|forged/i,
  RESEARCH_THEFT: /research stolen|ip theft|plagiarism|patent stolen/i,
}
const EDU_KEYWORDS = /university|college|institute|iit|nit|bits|student|academic|education|aicte|ugc|naac/i

function classifyFromKeywords(text) {
  const t = text || ''
  for (const [type, regex] of Object.entries(THREAT_KEYWORDS)) {
    if (regex.test(t)) return type
  }
  return 'GENERAL_THREAT'
}

function severityFromType(type) {
  return { RANSOMWARE:'CRITICAL', CREDENTIAL_DUMP:'HIGH', DATA_BREACH:'HIGH', EXAM_LEAK:'HIGH', RESEARCH_THEFT:'MEDIUM', FAKE_DOCUMENT:'MEDIUM', PHISHING:'MEDIUM', GENERAL_THREAT:'LOW' }[type] || 'LOW'
}

// Safe RSS parsing — uses string operations, no regex catastrophic backtracking
function parseRSSItems(xml) {
  const items = []
  let pos = 0
  const MAX_ITEMS = 20

  while (items.length < MAX_ITEMS) {
    const start = xml.indexOf('<item>', pos)
    if (start === -1) break
    const end = xml.indexOf('</item>', start)
    if (end === -1) break
    const chunk = xml.slice(start + 6, end)
    pos = end + 7

    const extractTag = (tag) => {
      const open = chunk.indexOf(`<${tag}>`)
      const close = chunk.indexOf(`</${tag}>`)
      if (open === -1 || close === -1) return ''
      return chunk.slice(open + tag.length + 2, close)
        .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
        .replace(/<[^>]{0,200}>/g, '') // strip HTML tags, max 200 chars per tag
        .trim()
        .slice(0, 2000) // hard cap per field
    }

    items.push({
      title: extractTag('title'),
      description: extractTag('description'),
      link: extractTag('link'),
      pubDate: extractTag('pubDate')
    })
  }
  return items
}

async function scrapeChannel(channel) {
  const alerts = []
  try {
    // Only fetch from rsshub.app — hardcoded, not user-controlled
    const rssUrl = `https://rsshub.app/telegram/channel/${encodeURIComponent(channel.username)}`
    const res = await fetch(rssUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []

    // Limit response size to prevent memory exhaustion
    const contentLength = parseInt(res.headers.get('content-length') || '0')
    if (contentLength > 500000) return [] // reject > 500KB responses

    const xml = await res.text()
    if (xml.length > 500000) return [] // double-check after read

    const items = parseRSSItems(xml)

    for (const item of items) {
      const text = `${item.title} ${item.description}`
      if (!EDU_KEYWORDS.test(text)) continue

      const threatType = classifyFromKeywords(text)

      // Only store safe https:// URLs
      const safeLink = sanitizeUrl(item.link)

      const safeTitle = `[${channel.name}] ${item.title.replace(/[<>"']/g, '').slice(0, 200)}`
      const safeDesc = item.description.replace(/[<>"']/g, '').slice(0, 500)

      alerts.push({
        institution_domain: 'general',
        institution_name: 'General Intelligence',
        threat_type: threatType,
        severity: severityFromType(threatType),
        source: 'TELEGRAM',
        source_url: safeLink,
        title: safeTitle,
        description: safeDesc,
        raw_data: null,
        detected_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
      })
    }
  } catch (e) { console.warn(`[telegram] channel ${channel.username} error:`, e.message) }
  return alerts
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'X-Content-Type-Options': 'nosniff'
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  // Allow scheduled invocations; manual triggers need admin role
  const isScheduled = event.headers?.['x-netlify-scheduled'] === 'true'
  if (!isScheduled) {
    const auth = await requireAuth(event, ['aicte_admin'])
    if (auth.response) return { ...auth.response, headers }
  }

  try {
    const allAlerts = (await Promise.all(TELEGRAM_CHANNELS.map(scrapeChannel))).flat()

    let inserted = 0
    if (allAlerts.length > 0) {
      const { count, error } = await supabase
        .from('threat_alerts')
        .upsert(allAlerts, { onConflict: 'source_url,institution_domain', ignoreDuplicates: true, count: 'exact' })
      if (error) console.error('[telegram] upsert error:', error.code)
      inserted = count || 0
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ alerts_found: allAlerts.length, alerts_inserted: inserted })
    }
  } catch (err) {
    return { ...safeError(err), headers }
  }
}
