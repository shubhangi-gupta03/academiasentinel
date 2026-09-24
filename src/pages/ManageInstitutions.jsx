import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

const DOMAIN_REGEX = /^[a-z0-9][a-z0-9\-.]{0,252}\.[a-z]{2,10}$/i
const PRIVATE_IP = /(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/

function validateDomain(domain) {
  if (!domain || !DOMAIN_REGEX.test(domain)) return 'Invalid domain format (e.g. mitwpu.edu.in)'
  if (PRIVATE_IP.test(domain)) return 'Private/internal domains not allowed'
  if (!domain.includes('.')) return 'Domain must have a TLD'
  return null
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
}

export default function ManageInstitutions() {
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', domain: '', state: '', type: 'Engineering', naac_grade: '', student_count: '' })
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState('')
  const [domainError, setDomainError] = useState('')

  useEffect(() => { loadInstitutions() }, [])

  async function loadInstitutions() {
    const { data } = await supabase.from('institutions').select('*').order('name')
    setInstitutions(data || [])
    setLoading(false)
  }

  async function addInstitution(e) {
    e.preventDefault()
    // Validate domain client-side before insert
    const domErr = validateDomain(form.domain)
    if (domErr) { setDomainError(domErr); return }
    setDomainError('')
    setAdding(true); setMsg('')
    const { error } = await supabase.from('institutions').insert({
      name: form.name.slice(0, 200),
      domain: form.domain.toLowerCase().trim(),
      state: form.state.slice(0, 100),
      type: form.type,
      naac_grade: form.naac_grade.slice(0, 10),
      student_count: Math.min(Math.max(parseInt(form.student_count) || 0, 0), 10000000),
      risk_score: 100
    })
    if (error) setMsg('Error adding institution. Please try again.')
    else {
      setMsg('✓ Institution added and queued for OSINT scan')
      setForm({ name: '', domain: '', state: '', type: 'Engineering', naac_grade: '', student_count: '' })
      loadInstitutions()
    }
    setAdding(false)
  }

  async function removeInstitution(id, name) {
    if (!confirm(`Remove ${name} from monitoring?`)) return
    await supabase.from('institutions').delete().eq('id', id)
    loadInstitutions()
  }

  async function triggerScanFor(domain) {
    setMsg(`Scanning ${domain}...`)
    try {
      const res = await apiFetch('/api/scan')
      if (res.status === 401) { setMsg('Session expired. Please sign in again.'); return }
      if (res.status === 403) { setMsg('Admin access required to trigger scans.'); return }
      const data = await res.json()
      setMsg(`✓ Scan complete — ${data.alerts_found || 0} threats found`)
      loadInstitutions()
    } catch { setMsg('Scan failed. Please try again.') }
  }

  const INPUT = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%' }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Manage Monitored Institutions</h1>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 20 }}>
        Add or remove institutions from OSINT monitoring. All entries stored in Supabase — nothing hardcoded.
      </div>

      {/* Add form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14 }}>➕ Add New Institution</div>
        <form onSubmit={addInstitution}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>INSTITUTION NAME *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="MIT World Peace University" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>DOMAIN *</label>
              <input required value={form.domain}
                onChange={e => { setForm(p => ({ ...p, domain: e.target.value.toLowerCase().trim().slice(0, 253) })); setDomainError('') }}
                placeholder="mitwpu.edu.in" style={{ ...INPUT, borderColor: domainError ? '#ef4444' : undefined }} />
              {domainError && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3 }}>{domainError}</div>}
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>STATE</label>
              <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={INPUT}>
                {['Engineering', 'University', 'IIT', 'NIT', 'Medical', 'Arts', 'Management'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>NAAC GRADE</label>
              <input value={form.naac_grade} onChange={e => setForm(p => ({ ...p, naac_grade: e.target.value }))} placeholder="A+" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>STUDENT COUNT</label>
              <input type="number" value={form.student_count} onChange={e => setForm(p => ({ ...p, student_count: e.target.value }))} placeholder="18000" style={INPUT} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" disabled={adding} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {adding ? 'Adding...' : 'Add & Start Monitoring'}
            </button>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('✓') ? '#22c55e' : '#ef4444' }}>{msg}</span>}
          </div>
        </form>
      </div>

      {/* Institution list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          <span>Monitored Institutions ({institutions.length})</span>
          <button onClick={() => triggerScanFor('all')} style={{ background: '#1e2d45', color: '#3b82f6', border: '1px solid #3b82f640', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            🔍 Scan All Now
          </button>
        </div>
        {loading ? <div style={{ padding: 24, color: 'var(--text2)' }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Institution', 'Domain', 'State', 'Type', 'Risk Score', 'Last Scan', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--text2)', fontWeight: 700, letterSpacing: .5, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst, i) => (
                <tr key={inst.id} style={{ borderBottom: i < institutions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#fff', fontWeight: 600 }}>{inst.name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>{inst.domain}</td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text2)' }}>{inst.state || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text2)' }}>{inst.type}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontWeight: 800, color: inst.risk_score < 40 ? '#ef4444' : inst.risk_score < 60 ? '#f97316' : inst.risk_score < 80 ? '#eab308' : '#22c55e' }}>
                      {inst.risk_score ?? '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text2)' }}>
                    {inst.last_scanned ? new Date(inst.last_scanned).toLocaleString('en-IN') : 'Never'}
                  </td>
                  <td style={{ padding: '10px 16px', display: 'flex', gap: 6 }}>
                    <button onClick={() => triggerScanFor(inst.domain)} style={{ background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                      Scan
                    </button>
                    <button onClick={() => removeInstitution(inst.id, inst.name)} style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
