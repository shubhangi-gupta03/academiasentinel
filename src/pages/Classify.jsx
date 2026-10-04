import { useState } from 'react'

const MOCK_RESULTS = {
  CREDENTIAL_DUMP: { threat_type: 'CREDENTIAL_DUMP', severity: 'CRITICAL', confidence: 94, summary: 'User credentials or passwords detected in the submitted content. Immediate password resets and breach notification recommended.', recommendations: ['Force password resets for affected accounts', 'Enable MFA across all institutional systems', 'Notify CERT-In within 6 hours per PDPB 2023', 'Search HIBP for affected email domains'] },
  EXAM_LEAK: { threat_type: 'EXAM_LEAK', severity: 'CRITICAL', confidence: 91, summary: 'Examination content appears to have been exposed prior to official release. Coordinated leak network suspected.', recommendations: ['Alert examination authority immediately', 'Issue takedown notices to hosting platforms', 'Coordinate with Cyber Crime Cell', 'Consider paper re-evaluation if leak is confirmed'] },
  RANSOMWARE: { threat_type: 'RANSOMWARE', severity: 'CRITICAL', confidence: 88, summary: 'Ransomware indicators detected. Systems may be at risk of encryption and data loss.', recommendations: ['Isolate affected systems immediately', 'Contact CERT-In incident response team', 'Do NOT pay ransom — escalate to law enforcement', 'Restore from last known clean backup'] },
  DATA_BREACH: { threat_type: 'DATA_BREACH', severity: 'HIGH', confidence: 87, summary: 'Sensitive personal data of students or faculty appears to have been exposed. PDPB 2023 compliance action required.', recommendations: ['Identify scope of breach within 24 hours', 'Notify affected individuals', 'File breach report with CERT-In', 'Engage a forensic investigation team'] },
  FAKE_DOCUMENT: { threat_type: 'FAKE_DOCUMENT', severity: 'HIGH', confidence: 82, summary: 'Forged academic credentials or certificates detected. Organized document fraud operation likely.', recommendations: ['Alert institution registrar and anti-fraud cell', 'Cross-check enrollment numbers in official database', 'File FIR with local Cyber Crime Cell', 'Issue public advisory to employers'] },
  PHISHING: { threat_type: 'PHISHING', severity: 'MEDIUM', confidence: 85, summary: 'Phishing campaign targeting institutional users detected. Credential harvesting site may be active.', recommendations: ['Submit URL to Google Safe Browsing & PhishTank', 'Send campus-wide phishing awareness alert', 'Request ISP/hosting takedown', 'Monitor HIBP for affected accounts'] },
  RESEARCH_THEFT: { threat_type: 'RESEARCH_THEFT', severity: 'HIGH', confidence: 79, summary: 'Pre-publication research content detected in unauthorized channels. Insider threat or email compromise suspected.', recommendations: ['Audit faculty email access logs', 'File IP theft complaint with institution legal team', 'Alert journal editors of potential preprint fraud', 'Enable DLP on institutional email servers'] },
  GENERAL_THREAT: { threat_type: 'GENERAL_THREAT', severity: 'LOW', confidence: 62, summary: 'Suspicious activity detected but does not match known high-risk patterns. Manual review recommended.', recommendations: ['Escalate to institution IT security team', 'Monitor for follow-up activity', 'Document and log incident for trend analysis'] },
}

function classifyLocally(text, institution) {
  const t = (text + ' ' + institution).toLowerCase()
  if (t.match(/password|credential|login|dump|breach|pwned|hash/)) return MOCK_RESULTS.CREDENTIAL_DUMP
  if (t.match(/exam|paper|question|jee|neet|gate|answer key|leak/)) return MOCK_RESULTS.EXAM_LEAK
  if (t.match(/ransomware|encrypt|lockbit|ransom|bitcoin|btc/)) return MOCK_RESULTS.RANSOMWARE
  if (t.match(/aadhaar|personal data|student data|admission|scholarship/)) return MOCK_RESULTS.DATA_BREACH
  if (t.match(/fake|forged|degree|certificate|marksheet|fraud/)) return MOCK_RESULTS.FAKE_DOCUMENT
  if (t.match(/phish|clone|spoof|login page|harvest/)) return MOCK_RESULTS.PHISHING
  if (t.match(/research|paper|publication|ip theft|plagiar/)) return MOCK_RESULTS.RESEARCH_THEFT
  return MOCK_RESULTS.GENERAL_THREAT
}

const SEVERITY_COLOR = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }
const THREAT_ICONS = { EXAM_LEAK: '📝', CREDENTIAL_DUMP: '🔑', RANSOMWARE: '💀', DATA_BREACH: '💾', FAKE_DOCUMENT: '📄', RESEARCH_THEFT: '🔬', PHISHING: '🎣', GENERAL_THREAT: '⚠️' }

export default function Classify() {
  const [form, setForm] = useState({ institution: '', content: '', source: 'MANUAL' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.content.trim()) return
    setLoading(true); setResult(null)
    await new Promise(r => setTimeout(r, 1800))
    setResult(classifyLocally(form.content, form.institution))
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>AI Threat Classifier</h1>
        <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
          Paste suspicious content to auto-classify threat type and severity
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Institution Name</label>
            <input
              value={form.institution}
              onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
              placeholder="e.g. IIT Bombay, Delhi University..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Source</label>
            <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '9px 12px', fontSize: 13, width: '100%' }}>
              {['MANUAL', 'TELEGRAM', 'PASTE_SITE', 'HIBP', 'GOOGLE_CSE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Threat Content / Description</label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Paste the suspicious content, URL, or description here. E.g. 'Telegram channel selling JEE Advanced papers for ₹10,000...' or paste leaked credential text..."
              rows={8}
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '10px 14px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading || !form.content.trim()} style={{
            background: loading ? '#1e2d45' : '#3b82f6', color: loading ? 'var(--text2)' : '#fff',
            border: 'none', borderRadius: 8, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? '🧠 Analysing threat...' : '⚡ Classify with AI'}
          </button>
        </form>

        {result && (
          <div style={{ background: 'var(--surface)', border: `2px solid ${SEVERITY_COLOR[result.severity]}40`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{THREAT_ICONS[result.threat_type]}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: SEVERITY_COLOR[result.severity] }}>
                  {result.threat_type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Confidence: {result.confidence}%</div>
              </div>
              <span className={`badge badge-${result.severity}`} style={{ marginLeft: 'auto' }}>{result.severity}</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>AI Analysis</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px' }}>
                {result.summary}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Recommended Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
                    <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 12, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setResult(null)} style={{
              marginTop: 16, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, width: '100%'
            }}>
              Clear & Classify Another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
