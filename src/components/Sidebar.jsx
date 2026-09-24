const NAV = [
  { id: 'dashboard', icon: '🛡️', label: 'Dashboard' },
  { id: 'threats', icon: '⚠️', label: 'Threat Feed' },
  { id: 'institutions', icon: '🏛️', label: 'Institutions' },
  { id: 'manage', icon: '⚙️', label: 'Manage Institutions' },
  { id: 'classify', icon: '🤖', label: 'AI Classifier' },
  { id: 'predict', icon: '📅', label: 'Risk Calendar' },
  { id: 'report', icon: '📋', label: 'CERT-In Report' },
]

export default function Sidebar({ tab, setTab, alertCount, user, onLogout }) {
  const role = user?.user_metadata?.role || (user?.demo ? 'aicte_admin' : 'viewer')
  const roleColors = { aicte_admin: '#3b82f6', cert_in: '#8b5cf6', institution: '#22c55e', viewer: '#64748b' }

  return (
    <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🎓</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Academia<span style={{ color: '#3b82f6' }}>Sentinel</span></div>
            <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 1 }}>SIH 2026 · PS 26202</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: roleColors[role] || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {(user?.email || 'D')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email?.split('@')[0] || 'Demo User'}
          </div>
          <div style={{ fontSize: 9, color: roleColors[role] || '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3 }}>
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === n.id ? '#3b82f620' : 'transparent',
            color: tab === n.id ? '#3b82f6' : 'var(--text2)',
            fontWeight: tab === n.id ? 700 : 400, fontSize: 12, marginBottom: 2,
            transition: 'all .15s', textAlign: 'left'
          }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            {n.label}
            {n.id === 'threats' && alertCount > 0 && (
              <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, marginBottom: 6 }}>● Live monitoring active</div>
        <div style={{ fontSize: 9, color: 'var(--text2)', marginBottom: 8 }}>MIT-WPU Pune · AICTE/MIC</div>
        <button onClick={onLogout} style={{
          width: '100%', background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text2)', borderRadius: 6, padding: '6px', fontSize: 11, cursor: 'pointer'
        }}>Sign Out</button>
      </div>
    </aside>
  )
}
