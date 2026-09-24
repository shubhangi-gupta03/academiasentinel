import { apiFetch } from '../lib/api'
import { useState, useEffect } from 'react'

function RiskBar({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'
  const label = score >= 80 ? 'SECURE' : score >= 60 ? 'MODERATE' : score >= 40 ? 'AT RISK' : 'CRITICAL'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .5s' }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 52 }}>{label}</span>
    </div>
  )
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('risk_score')

  useEffect(() => {
    apiFetch('/api/institutions')
      .then(r => r.json())
      .then(data => { setInstitutions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sorted = [...institutions].sort((a, b) =>
    sort === 'risk_score' ? a.risk_score - b.risk_score : b.student_count - a.student_count
  )

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)', textAlign: 'center' }}>Loading institutions...</div>

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Institution Risk Monitor</h1>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
            {institutions.length} AICTE-affiliated institutions · Sorted by security risk
          </div>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
          borderRadius: 8, padding: '7px 12px', fontSize: 12
        }}>
          <option value="risk_score">Sort: Risk Score</option>
          <option value="student_count">Sort: Student Count</option>
        </select>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Critical Risk', value: institutions.filter(i => i.risk_score < 40).length, color: '#ef4444' },
          { label: 'At Risk', value: institutions.filter(i => i.risk_score >= 40 && i.risk_score < 60).length, color: '#f97316' },
          { label: 'Moderate', value: institutions.filter(i => i.risk_score >= 60 && i.risk_score < 80).length, color: '#eab308' },
          { label: 'Secure', value: institutions.filter(i => i.risk_score >= 80).length, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Institution cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {sorted.map(inst => (
          <div key={inst.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
            borderLeft: `4px solid ${inst.risk_score < 40 ? '#ef4444' : inst.risk_score < 60 ? '#f97316' : inst.risk_score < 80 ? '#eab308' : '#22c55e'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{inst.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{inst.domain} · {inst.state}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: inst.risk_score < 40 ? '#ef4444' : inst.risk_score < 60 ? '#f97316' : inst.risk_score < 80 ? '#eab308' : '#22c55e' }}>
                  {inst.risk_score}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)' }}>security score</div>
              </div>
            </div>
            <RiskBar score={inst.risk_score} />
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--text2)' }}>
              <span>🎓 {inst.student_count?.toLocaleString('en-IN')} students</span>
              <span>📋 NAAC {inst.naac_grade || 'N/A'}</span>
              <span>🏷️ {inst.type}</span>
            </div>
            {inst.last_scanned && (
              <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 6 }}>
                Last scanned: {new Date(inst.last_scanned).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
