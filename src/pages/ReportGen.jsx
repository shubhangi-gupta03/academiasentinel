import { apiFetch } from '../lib/api'
import { useState, useEffect } from 'react'

export default function ReportGen() {
  const [alerts, setAlerts] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingAlerts, setFetchingAlerts] = useState(true)

  useEffect(() => {
    apiFetch('/api/alerts?severity=HIGH&limit=20')
      .then(r => r.json())
      .then(d => { setAlerts(d); setFetchingAlerts(false) })
      .catch(() => setFetchingAlerts(false))
  }, [])

  async function generateReport() {
    if (!selectedAlert) return
    setLoading(true); setReport('')
    try {
      const res = await apiFetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: selectedAlert.id,
          institution: selectedAlert.institution_name,
          threat_type: selectedAlert.threat_type,
          severity: selectedAlert.severity,
          description: selectedAlert.description,
          detected_at: selectedAlert.detected_at
        })
      })
      const data = await res.json()
      setReport(data.report)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function downloadReport() {
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `cert-in-report-${selectedAlert?.institution_name}-${Date.now()}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>CERT-In Incident Report Generator</h1>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 20 }}>
        Auto-generate CERT-In compliant incident reports using Groq LLaMA AI · IT Act 2000 · PDPB 2023
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        {/* Alert selector */}
        <div>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 10, fontSize: 13 }}>Select Incident</div>
          {fetchingAlerts ? (
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>Loading alerts...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.map(a => (
                <div key={a.id} onClick={() => setSelectedAlert(a)} style={{
                  background: selectedAlert?.id === a.id ? '#3b82f615' : 'var(--surface)',
                  border: `1px solid ${selectedAlert?.id === a.id ? '#3b82f6' : 'var(--border)'}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    {a.title?.slice(0, 50)}{a.title?.length > 50 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                    <span style={{ fontSize: 10, color: 'var(--text2)' }}>{a.institution_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report area */}
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button onClick={generateReport} disabled={!selectedAlert || loading} style={{
              background: !selectedAlert || loading ? '#1e2d45' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px',
              cursor: !selectedAlert || loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 13
            }}>
              {loading ? '⏳ Generating...' : '📋 Generate CERT-In Report'}
            </button>
            {report && (
              <button onClick={downloadReport} style={{
                background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40',
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13
              }}>⬇️ Download .txt</button>
            )}
          </div>

          {!selectedAlert && !report && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div>Select an incident from the left to generate a CERT-In report</div>
            </div>
          )}

          {report && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Generated CERT-In Report</span>
                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>✓ AI Generated · {new Date().toLocaleString('en-IN')}</span>
              </div>
              <pre style={{
                fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', lineHeight: 1.7,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 500, overflow: 'auto'
              }}>{report}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
