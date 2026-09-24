import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ThreatFeed from './pages/ThreatFeed'
import Institutions from './pages/Institutions'
import Classify from './pages/Classify'
import ReportGen from './pages/ReportGen'
import PredictiveCal from './pages/PredictiveCal'
import Login from './pages/Login'
import ManageInstitutions from './pages/ManageInstitutions'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [liveAlerts, setLiveAlerts] = useState([])
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('threat-alerts-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threat_alerts' }, payload => {
        setLiveAlerts(prev => [payload.new, ...prev].slice(0, 5))
        setAlertCount(c => c + 1)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text2)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
        <div>Loading AcademiaSentinel...</div>
      </div>
    </div>
  )

  if (!user) return <Login onLogin={u => setUser(u)} />

  const pages = {
    dashboard: <Dashboard liveAlerts={liveAlerts} user={user} />,
    threats: <ThreatFeed />,
    institutions: <Institutions />,
    manage: <ManageInstitutions />,
    classify: <Classify />,
    report: <ReportGen />,
    predict: <PredictiveCal />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar tab={tab} setTab={setTab} alertCount={alertCount} user={user}
        onLogout={async () => { await supabase.auth.signOut(); setUser(null) }} />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {pages[tab] || pages.dashboard}
      </main>
    </div>
  )
}
