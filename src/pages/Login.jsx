import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Roles displayed for information only — server-side trigger enforces 'viewer' on signup.
// Admins upgrade roles via Supabase SQL Editor (see supabase_schema.sql comments).
const ROLES = [
  { id: 'viewer', label: 'Viewer', icon: '👁️', desc: 'Read-only dashboard access (default)' },
  { id: 'institution', label: 'Institution IT', icon: '🔐', desc: 'Applied during onboarding by AICTE admin' },
  { id: 'cert_in', label: 'CERT-In Officer', icon: '🛡️', desc: 'Granted by AICTE admin after verification' },
  { id: 'aicte_admin', label: 'AICTE Admin', icon: '🏛️', desc: 'Assigned via Supabase by super-admin only' },
]

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | signup
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    // Client-side length guards
    if (email.length > 254 || password.length > 128) {
      setError('Input too long'); setLoading(false); return
    }

    try {
      if (mode === 'signup') {
        // NOTE: role is NOT sent here. Server-side trigger (enforce_default_role)
        // in Supabase always sets role='viewer' regardless of any client-supplied value.
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        setError('Account created. Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        onLogin(data.user)
      }
    } catch (e) {
      // Only show safe error messages — never expose internal details
      const safeMessages = {
        'Invalid login credentials': 'Incorrect email or password.',
        'Email not confirmed': 'Please confirm your email address first.',
        'User already registered': 'An account with this email already exists.',
        'Password should be at least 6 characters': 'Password must be at least 6 characters.',
      }
      setError(safeMessages[e.message] || 'An error occurred. Please try again.')
    }
    setLoading(false)
  }

  const INPUT_STYLE = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
            Academia<span style={{ color: '#3b82f6' }}>Sentinel</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>
            AI Cyber Threat Intelligence · Indian Higher Education
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>SIH 2026 · PS 26202 · AICTE/MIC</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: mode === m ? '#3b82f6' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)', fontWeight: 700, fontSize: 13
              }}>{m === 'login' ? 'Sign In' : 'Register'}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: 'var(--text2)' }}>
                ℹ️ New accounts start as <strong style={{ color: '#fff' }}>Viewer</strong>. Role upgrades are managed by AICTE administrators.
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>EMAIL</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value.slice(0, 254))}
                required maxLength={254}
                placeholder="you@institution.ac.in"
                style={INPUT_STYLE}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>PASSWORD</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value.slice(0, 128))}
                required maxLength={128} minLength={mode === 'signup' ? 8 : 1}
                placeholder="••••••••"
                style={INPUT_STYLE}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>Minimum 8 characters</div>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 12, color: error.includes('created') || error.includes('confirm') ? '#22c55e' : '#ef4444', padding: '8px 10px', background: error.includes('created') ? '#22c55e10' : '#ef444410', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: loading ? '#1e3a5f' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background .2s'
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Role reference — informational only, not functional */}
          {mode === 'signup' && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>ROLE REFERENCE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ROLES.map(r => (
                  <div key={r.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px' }}>
                    <div style={{ fontSize: 12 }}>{r.icon} <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 10 }}>{r.label}</span></div>
                    <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 2, lineHeight: 1.3 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
