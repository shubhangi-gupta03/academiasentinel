import { useState } from 'react'
import { MOCK_ALERTS } from '../lib/mockData'

const THREAT_ICONS = {
  EXAM_LEAK: '📝', CREDENTIAL_DUMP: '🔑', RANSOMWARE: '💀',
  DATA_BREACH: '💾', FAKE_DOCUMENT: '📄', RESEARCH_THEFT: '🔬',
  PHISHING: '🎣', GENERAL_THREAT: '⚠️'
}

export default function ThreatFeed() {
  const [filter, setFilter] = useState({ severity: '', threat_type: '' })
  const [selected, setSelected] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  const alerts = MOCK_ALERTS.filter(a => {
    if (filter.severity && a.severity !== filter.severity) return false
    if (filter.threat_type && a.threat_type !== filter.threat_type) return false
    return true
  })

  async function triggerScan() {
    setScanning(true); setScanMsg('')
    await new Promise(r => setTimeout(r, 2000))
    setScanMsg('✓ Scan complete — 3 new threats detected (demo mode)')
    setScanning(false)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Threat Intelligence Feed</h1>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
            OSINT-powered alerts from dark web, paste sites & breach databases
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {scanMsg && <span style={{ fontSize: 11, color: '#22c55e' }}>{scanMsg}</span>}
          <button onClick={triggerScan} disabled={scanning} style={{
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            {scanning ? '⏳ Scanning...' : '🔍 Run OSINT Scan'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'severity', options: ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], label: 'Severity' },
          { key: 'threat_type', options: ['', 'EXAM_LEAK', 'CREDENTIAL_DUMP', 'RANSOMWARE', 'DATA_BREACH', 'FAKE_DOCUMENT', 'RESEARCH_THEFT', 'PHISHING'], label: 'Type' }
        ].map(f => (
          <select key={f.key} value={filter[f.key]} onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value }))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
            <option value="">All {f.label}</option>
            {f.options.slice(1).map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </select>
        ))}
        <div style={{ color: 'var(--text2)', fontSize: 12, alignSelf: 'center', marginLeft: 8 }}>
          {alerts.length} alerts
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map(a => (
            <div key={a.id} onClick={() => setSelected(a)} style={{
              background: selected?.id === a.id ? '#3b82f610' : 'var(--surface)',
              border: `1px solid ${selected?.id === a.id ? '#3b82f6' : 'var(--border)'}`,
              borderLeft: `4px solid ${a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'HIGH' ? '#f97316' : a.severity === 'MEDIUM' ? '#eab308' : '#22c55e'}`,
              borderRadius: 10, padding: '12px 16px', cursor: 'pointer', transition: 'all .15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span>{THREAT_ICONS[a.threat_type] || '⚠️'}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{a.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                    {a.description?.slice(0, 120)}...
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>🏛️ {a.institution_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>📡 {a.source}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>🕐 {new Date(a.detected_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                  <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                  <span style={{ fontSize: 10, color: 'var(--text2)' }}>{a.threat_type?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, alignSelf: 'flex-start', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Alert Detail</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>THREAT</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{selected.title}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge badge-${selected.severity}`}>{selected.severity}</span>
                <span style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, color: 'var(--text2)' }}>
                  {selected.threat_type?.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>DESCRIPTION</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{selected.description}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Institution', selected.institution_name],
                  ['Source', selected.source],
                  ['Status', selected.status],
                  ['Detected', new Date(selected.detected_at).toLocaleDateString('en-IN')]
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text2)' }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
