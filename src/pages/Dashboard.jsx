import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { MOCK_ALERTS, MOCK_INSTITUTIONS, MOCK_PREDICT } from '../lib/mockData'

const THREAT_COLORS = {
  EXAM_LEAK: '#f97316', CREDENTIAL_DUMP: '#ef4444', RANSOMWARE: '#dc2626',
  DATA_BREACH: '#f97316', FAKE_DOCUMENT: '#eab308', RESEARCH_THEFT: '#8b5cf6',
  PHISHING: '#06b6d4', GENERAL_THREAT: '#64748b'
}

export default function Dashboard({ liveAlerts = [] }) {
  const alerts = MOCK_ALERTS
  const institutions = MOCK_INSTITUTIONS
  const prediction = MOCK_PREDICT

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length
  const highCount = alerts.filter(a => a.severity === 'HIGH').length
  const avgRisk = Math.round(institutions.reduce((s, i) => s + (100 - i.risk_score), 0) / institutions.length)

  // Threat distribution
  const dist = {}
  alerts.forEach(a => { dist[a.threat_type] = (dist[a.threat_type] || 0) + 1 })
  const threatDist = Object.entries(dist).map(([name, value]) => ({ name, value }))

  // Source distribution
  const srcMap = { HIBP: 0, PASTE_SITE: 0, TELEGRAM: 0, MANUAL: 0, GOOGLE_CSE: 0 }
  alerts.forEach(a => { const s = a.source || 'MANUAL'; srcMap[s] = (srcMap[s] || 0) + 1 })
  const SOURCE_LABELS = { HIBP: 'HaveIBeenPwned', PASTE_SITE: 'Paste Sites', TELEGRAM: 'Telegram', MANUAL: 'Manual Entry', GOOGLE_CSE: 'Google CSE' }
  const SOURCE_COLORS = { HIBP: '#ef4444', PASTE_SITE: '#f97316', TELEGRAM: '#8b5cf6', MANUAL: '#64748b', GOOGLE_CSE: '#3b82f6' }
  const sourceDist = Object.entries(srcMap).filter(([, v]) => v > 0).map(([src, count]) => ({
    source: SOURCE_LABELS[src] || src, count, color: SOURCE_COLORS[src] || '#64748b'
  }))

  // Trend (last 7 days)
  const trendData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const count = alerts.filter(a => a.detected_at?.startsWith(dateStr)).length
    trendData.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), alerts: count })
  }
  // Fill in some realistic numbers for demo
  const demoTrend = trendData.map((t, i) => ({ ...t, alerts: t.alerts || [2,1,4,3,6,5,3][i] }))

  const riskLevel = prediction.current_risk_multiplier >= 2.5 ? 'CRITICAL'
    : prediction.current_risk_multiplier >= 2 ? 'HIGH'
    : prediction.current_risk_multiplier >= 1.5 ? 'ELEVATED' : 'NORMAL'

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Threat Intelligence Dashboard</h1>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
          Real-time cybersecurity monitoring for Indian Higher Education · Last updated: {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>

      {/* Risk banner */}
      {prediction.active_windows?.length > 0 && (
        <div style={{
          background: '#f9731615', border: '1px solid #f9731640', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ color: '#f97316', fontWeight: 700 }}>Elevated Risk Period Active</div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>
              {prediction.active_windows.map(w => w.event).join(' · ')} — Threat multiplier: {prediction.current_risk_multiplier}x
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Alerts', value: alerts.length, icon: '🚨', color: '#3b82f6' },
          { label: 'Critical', value: criticalCount, icon: '🔴', color: '#ef4444' },
          { label: 'High Severity', value: highCount, icon: '🟠', color: '#f97316' },
          { label: 'Avg Risk Score', value: `${avgRisk}%`, icon: '📊', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 8 }}>{s.value}</div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 260px', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, color: '#fff' }}>Alert Trend — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={demoTrend}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="alerts" stroke="#3b82f6" fill="url(#alertGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: '#fff' }}>Threat Distribution</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={threatDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                {threatDist.map((entry, i) => (
                  <Cell key={i} fill={THREAT_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#e2e8f0', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
            {threatDist.slice(0, 4).map(t => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: THREAT_COLORS[t.name] || '#64748b' }} />
                {t.name.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#fff', fontSize: 13 }}>Intelligence Sources</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 14 }}>Multi-source OSINT aggregation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sourceDist.map(s => (
              <div key={s.source}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{s.source}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: s.color,
                    width: `${Math.round(s.count / Math.max(...sourceDist.map(x => x.count)) * 100)}%`,
                    transition: 'width .4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>✓ HIBP API · Paste Sites · Telegram · Manual</div>
          </div>
        </div>
      </div>

      {/* Recent alerts */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          <span>Recent Alerts</span>
          {liveAlerts.length > 0 && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>● {liveAlerts.length} new live</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.slice(0, 6).map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8,
              borderLeft: `3px solid ${a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'HIGH' ? '#f97316' : a.severity === 'MEDIUM' ? '#eab308' : '#22c55e'}`
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {a.institution_name} · {a.threat_type?.replace(/_/g, ' ')} · {new Date(a.detected_at).toLocaleString('en-IN')}
                </div>
              </div>
              <span className={`badge badge-${a.severity}`}>{a.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
