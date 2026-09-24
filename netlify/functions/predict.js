/**
 * AcademiaSentinel — Predictive Risk Engine
 * GET /api/predict
 * Requires: authenticated user (any role)
 */
import { createClient } from '@supabase/supabase-js'
import { requireAuth, safeError } from './_auth.js'

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || 'https://academiasentinel.netlify.app'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const ACADEMIC_EVENTS = [
  { month: 1, weeks: [3, 4], event: 'Semester End Exams', threat_types: ['EXAM_LEAK', 'CREDENTIAL_DUMP'] },
  { month: 2, weeks: [1, 2], event: 'Board Exam Season (CBSE/State)', threat_types: ['EXAM_LEAK', 'FAKE_DOCUMENT'] },
  { month: 3, weeks: [2, 3, 4], event: 'JEE / NEET Prep Peak', threat_types: ['EXAM_LEAK', 'PHISHING'] },
  { month: 4, weeks: [1, 2], event: 'University Finals', threat_types: ['EXAM_LEAK', 'CREDENTIAL_DUMP'] },
  { month: 5, weeks: [3, 4], event: 'GATE / CAT Registration', threat_types: ['PHISHING', 'CREDENTIAL_DUMP'] },
  { month: 7, weeks: [1, 2], event: 'Admission Season', threat_types: ['FAKE_DOCUMENT', 'PHISHING'] },
  { month: 10, weeks: [3, 4], event: 'Mid-Sem Exams', threat_types: ['EXAM_LEAK'] },
  { month: 11, weeks: [2, 3], event: 'CAT / MBA Entrance', threat_types: ['EXAM_LEAK', 'CREDENTIAL_DUMP'] },
  { month: 12, weeks: [1, 2, 3], event: 'Semester End + Campus Placements', threat_types: ['DATA_BREACH', 'CREDENTIAL_DUMP'] },
]

async function computeHistoricalMultipliers() {
  const { data: alerts } = await supabase
    .from('threat_alerts')
    .select('detected_at, severity')
    .gte('detected_at', new Date(Date.now() - 365 * 86400000).toISOString())

  if (!alerts?.length) return {}

  const monthCounts = {}
  for (const a of alerts) {
    const m = new Date(a.detected_at).getMonth() + 1
    if (!monthCounts[m]) monthCounts[m] = { total: 0, critical: 0, high: 0 }
    monthCounts[m].total++
    if (a.severity === 'CRITICAL') monthCounts[m].critical++
    else if (a.severity === 'HIGH') monthCounts[m].high++
  }

  const values = Object.values(monthCounts)
  const avgTotal = values.reduce((s, v) => s + v.total, 0) / Math.max(values.length, 1)

  const multipliers = {}
  for (const [month, counts] of Object.entries(monthCounts)) {
    const raw = counts.total / Math.max(avgTotal, 1)
    multipliers[parseInt(month)] = Math.max(1.0, Math.min(4.0, parseFloat(raw.toFixed(2))))
  }
  return multipliers
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

  const auth = await requireAuth(event)
  if (auth.response) return { ...auth.response, headers }

  try {
    const historicalMultipliers = await computeHistoricalMultipliers()
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentWeek = Math.ceil(now.getDate() / 7)

    const enrichedCalendar = ACADEMIC_EVENTS.map(ev => {
      const historicalMult = historicalMultipliers[ev.month]
      const baselineMult = ev.threat_types.includes('RANSOMWARE') ? 2.8
        : ev.threat_types.includes('EXAM_LEAK') ? 2.5
        : ev.threat_types.includes('DATA_BREACH') ? 2.2 : 1.8

      return {
        ...ev,
        risk_multiplier: historicalMult || baselineMult,
        data_source: historicalMult ? 'historical_db' : 'academic_baseline'
      }
    })

    const activeWindows = enrichedCalendar.filter(w => w.month === currentMonth && w.weeks.includes(currentWeek))
    const currentMultiplier = activeWindows.length > 0
      ? Math.max(...activeWindows.map(w => w.risk_multiplier))
      : (historicalMultipliers[currentMonth] || 1.0)

    const upcoming = []
    for (let d = 1; d <= 45; d++) {
      const future = new Date(now.getTime() + d * 86400000)
      const m = future.getMonth() + 1
      const wk = Math.ceil(future.getDate() / 7)
      const match = enrichedCalendar.find(w => w.month === m && w.weeks.includes(wk))
      if (match && !upcoming.find(u => u.event === match.event)) {
        upcoming.push({ ...match, days_until: d, date: future.toISOString().split('T')[0] })
      }
    }

    // Only expose non-sensitive columns
    const { data: atRisk } = await supabase
      .from('institutions')
      .select('name, domain, risk_score, state')
      .lt('risk_score', 60)
      .order('risk_score', { ascending: true })
      .limit(5)

    const [recent24, prev24] = await Promise.all([
      supabase.from('threat_alerts').select('id', { count: 'exact', head: true })
        .gte('detected_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('threat_alerts').select('id', { count: 'exact', head: true })
        .gte('detected_at', new Date(Date.now() - 2 * 86400000).toISOString())
        .lt('detected_at', new Date(Date.now() - 86400000).toISOString())
    ])

    const alertVelocity = {
      last_24h: recent24.count || 0,
      prev_24h: prev24.count || 0,
      trend: (recent24.count || 0) > (prev24.count || 0) ? 'RISING' : (recent24.count || 0) < (prev24.count || 0) ? 'FALLING' : 'STABLE'
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        current_risk_multiplier: parseFloat(currentMultiplier.toFixed(2)),
        active_windows: activeWindows,
        upcoming_high_risk: upcoming.slice(0, 5),
        risk_calendar: enrichedCalendar,
        at_risk_institutions: atRisk || [],
        alert_velocity: alertVelocity,
        historical_data_months: Object.keys(historicalMultipliers).length,
        generated_at: new Date().toISOString()
      })
    }
  } catch (err) {
    return { ...safeError(err), headers }
  }
}
