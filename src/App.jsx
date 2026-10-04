import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ThreatFeed from './pages/ThreatFeed'
import Institutions from './pages/Institutions'
import Classify from './pages/Classify'
import ReportGen from './pages/ReportGen'
import PredictiveCal from './pages/PredictiveCal'
import ManageInstitutions from './pages/ManageInstitutions'

// Demo user — no login required
const DEMO_USER = { email: 'demo@academiasentinel.in', role: 'aicte_admin' }

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [liveAlerts, setLiveAlerts] = useState([])
  const [alertCount, setAlertCount] = useState(0)

  const pages = {
    dashboard: <Dashboard liveAlerts={liveAlerts} user={DEMO_USER} />,
    threats: <ThreatFeed />,
    institutions: <Institutions />,
    manage: <ManageInstitutions />,
    classify: <Classify />,
    report: <ReportGen />,
    predict: <PredictiveCal />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar tab={tab} setTab={setTab} alertCount={alertCount} user={DEMO_USER} onLogout={() => {}} />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {pages[tab] || pages.dashboard}
      </main>
    </div>
  )
}
