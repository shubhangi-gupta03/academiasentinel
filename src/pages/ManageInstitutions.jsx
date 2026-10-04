import { useState } from 'react'
import { MOCK_INSTITUTIONS } from '../lib/mockData'

const INPUT_STYLE = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }

// Seed with mock data pre-loaded so it looks populated on first visit
const SEED = MOCK_INSTITUTIONS.map(i => ({ ...i, last_scanned: null }))

export default function ManageInstitutions() {
  const [institutions, setInstitutions] = useState(SEED)
  const [form, setForm] = useState({ name: '', domain: '', state: '', type: 'Engineering', naac_grade: '', student_count: '' })
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState('')
  const [scanning, setScanning] = useState(null)

  async function addInstitution(e) {
    e.preventDefault()
    if (!form.name || !form.domain) return
    setAdding(true); setMsg('')
    await new Promise(r => setTimeout(r, 800))
    const newInst = {
      id: Date.now(),
      name: form.name,
      domain: form.domain.toLowerCase().trim(),
      state: form.state,
      type: form.type,
      naac_grade: form.naac_grade,
      student_count: parseInt(form.student_count) || 0,
      risk_score: Math.floor(Math.random() * 40) + 40, // random 40-80
      last_scanned: null
    }
    setInstitutions(p => [...p, newInst])
    setMsg(`✓ ${form.name} added and queued for OSINT scan`)
    setForm({ name: '', domain: '', state: '', type: 'Engineering', naac_grade: '', student_count: '' })
    setAdding(false)
  }

  function removeInstitution(id, name) {
    if (!window.confirm(`Remove ${name} from monitoring?`)) return
    setInstitutions(p => p.filter(i => i.id !== id))
    setMsg(`Removed ${name} from monitoring`)
  }

  async function triggerScan(domain) {
    setScanning(domain); setMsg('')
    await new Promise(r => setTimeout(r, 2000))
    const alertsFound = Math.floor(Math.random() * 4)
    const newScore = Math.floor(Math.random() * 60) + 30
    setInstitutions(p => p.map(i => i.domain === domain
      ? { ...i, risk_score: newScore, last_scanned: new Date().toISOString() }
      : i
    ))
    setMsg(`✓ Scan complete for ${domain} — ${alertsFound} threat${alertsFound !== 1 ? 's' : ''} found`)
    setScanning(null)
  }

  async function scanAll() {
    setScanning('all'); setMsg('Scanning all institutions...')
    await new Promise(r => setTimeout(r, 3000))
    setInstitutions(p => p.map(i => ({
      ...i,
      risk_score: Math.floor(Math.random() * 60) + 30,
      last_scanned: new Date().toISOString()
    })))
    setMsg(`✓ All institutions scanned — ${Math.floor(Math.random() * 8) + 2} total threats found`)
    setScanning(null)
  }

  const riskColor = s => s < 40 ? '#ef4444' : s < 60 ? '#f97316' : s < 80 ? '#eab308' : '#22c55e'

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Manage Monitored Institutions</h1>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 20 }}>
        Add or remove institutions from OSINT monitoring. Changes saved locally in this session.
      </div>

      {/* Add form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14 }}>➕ Add New Institution</div>
        <form onSubmit={addInstitution}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>INSTITUTION NAME *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="MIT World Peace University" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>DOMAIN *</label>
              <input required value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="mitwpu.edu.in" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>STATE</label>
              <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={INPUT_STYLE}>
                {['Engineering', 'University', 'IIT', 'NIT', 'Medical', 'Arts', 'Management'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>NAAC GRADE</label>
              <input value={form.naac_grade} onChange={e => setForm(p => ({ ...p, naac_grade: e.target.value }))} placeholder="A+" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>STUDENT COUNT</label>
              <input type="number" value={form.student_count} onChange={e => setForm(p => ({ ...p, student_count: e.target.value }))} placeholder="18000" style={INPUT_STYLE} />
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
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Monitored Institutions ({institutions.length})</span>
          <button onClick={scanAll} disabled={scanning === 'all'} style={{ background: '#1e2d45', color: '#3b82f6', border: '1px solid #3b82f640', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {scanning === 'all' ? '⏳ Scanning...' : '🔍 Scan All Now'}
          </button>
        </div>
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
                  <span style={{ fontWeight: 800, color: riskColor(inst.risk_score ?? 50) }}>
                    {inst.risk_score ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text2)' }}>
                  {inst.last_scanned ? new Date(inst.last_scanned).toLocaleString('en-IN') : 'Never'}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => triggerScan(inst.domain)} disabled={scanning === inst.domain} style={{ background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                      {scanning === inst.domain ? '...' : 'Scan'}
                    </button>
                    <button onClick={() => removeInstitution(inst.id, inst.name)} style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
