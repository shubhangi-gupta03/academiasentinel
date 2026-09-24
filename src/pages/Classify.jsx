import { apiFetch } from '../lib/api'
import { useState } from 'react'

export default function Classify() {
  const [text, setText] = useState('')
  const [context, setContext] = useState('Indian education sector')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const SAMPLES = [
    { label: 'Exam Leak', text: 'Selling JEE Advanced 2026 paper, direct from source. All 3 shifts. Contact @seller_edu on Telegram. ₹5000 only. 100% genuine, paper coming out tomorrow.' },
    { label: 'Credential Dump', text: 'Fresh dump - vit.ac.in student credentials 2026. 45,000 rows. email:password format. includes faculty too. Available on our market for 0.05 BTC.' },
    { label: 'Ransomware', text: 'ALL FILES ON BHU SERVER ENCRYPTED. Pay 10 BTC to wallet 1A2B3C to get decryption key. You have 72 hours. Student records, exam data, research all encrypted.' },
    { label: 'Fake Degree', text: 'Get your MBA/B.Tech/MBBS degree from top Indian university. All holograms, signatures. Undetectable. IIT Bombay, DU, BITS available. Whatsapp +91-XXXXXXXXXX' }
  ]

  async function classify() {
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await apiFetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context })
      })
      if (!res.ok) throw new Error('Classification failed')
      setResult(await res.json())
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const severityColor = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>AI Threat Classifier</h1>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 20 }}>
        Paste any suspicious text — Groq LLaMA 3.3-70B classifies threat type, severity & recommends actions
      </div>

      {/* Sample buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text2)', alignSelf: 'center' }}>Quick samples:</span>
        {SAMPLES.map(s => (
          <button key={s.label} onClick={() => setText(s.text)} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer'
          }}>{s.label}</button>
        ))}
      </div>

      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste suspicious message, dark web listing, Telegram post, or any threat data..."
        style={{
          width: '100%', minHeight: 120, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13, resize: 'vertical',
          fontFamily: 'inherit', outline: 'none', lineHeight: 1.6, marginBottom: 12
        }} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={context} onChange={e => setContext(e.target.value)}
          placeholder="Context (e.g. Maharashtra engineering college)"
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none'
          }} />
        <button onClick={classify} disabled={loading || !text.trim()} style={{
          background: loading ? '#1e2d45' : '#3b82f6', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 20px', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap'
        }}>
          {loading ? '🤖 Analyzing...' : '🤖 Classify Threat'}
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}

      {result && (
        <div style={{ background: 'var(--surface)', border: `1px solid ${severityColor[result.severity] || 'var(--border)'}`, borderRadius: 12, padding: 20 }}>
          {/* Top row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4 }}>THREAT TYPE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{result.threat_type?.replace(/_/g, ' ')}</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4 }}>SEVERITY</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: severityColor[result.severity] }}>{result.severity}</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4 }}>CONFIDENCE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>{result.confidence}%</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4 }}>CERT-IN REPORT</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: result.cert_in_reportable ? '#ef4444' : '#22c55e' }}>
                {result.cert_in_reportable ? '⚠️ REQUIRED' : '✓ Not Required'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>AI SUMMARY</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
              {result.summary}
            </div>
          </div>

          {result.predicted_impact && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>PREDICTED IMPACT</div>
              <div style={{ fontSize: 13, color: '#f97316', fontWeight: 600 }}>⚡ {result.predicted_impact}</div>
            </div>
          )}

          {result.recommended_actions?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>IMMEDIATE ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.recommended_actions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
