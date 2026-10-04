import { MOCK_PREDICT } from '../lib/mockData'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const multiplierColor = m => m >= 2.5 ? '#ef4444' : m >= 2 ? '#f97316' : m >= 1.5 ? '#eab308' : '#22c55e'
const riskLabel = m => m >= 2.5 ? 'CRITICAL' : m >= 2 ? 'HIGH' : m >= 1.5 ? 'ELEVATED' : 'NORMAL'

export default function PredictiveCal() {
  const data = MOCK_PREDICT

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Predictive Risk Calendar</h1>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 20 }}>
        AI-powered threat prediction based on Indian academic calendar patterns — historically attacks peak before major exams
      </div>

      {/* Current risk banner */}
      <div style={{
        background: `${multiplierColor(data.current_risk_multiplier)}15`,
        border: `1px solid ${multiplierColor(data.current_risk_multiplier)}40`,
        borderRadius: 12, padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{ fontSize: 36 }}>
          {data.current_risk_multiplier >= 2.5 ? '🚨' : data.current_risk_multiplier >= 2 ? '⚠️' : '📊'}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: multiplierColor(data.current_risk_multiplier) }}>
            Current Risk Level: {riskLabel(data.current_risk_multiplier)}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
            Threat multiplier: {data.current_risk_multiplier}x baseline
            {data.active_windows?.length > 0
              ? ` · Active: ${data.active_windows.map(w => w.event).join(', ')}`
              : ' · No high-risk events active right now'}
          </div>
        </div>
      </div>

      {/* Upcoming risk windows */}
      {data.upcoming_high_risk?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 12 }}>Upcoming High-Risk Windows</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.upcoming_high_risk.map((w, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 16
              }}>
                <div style={{ background: `${multiplierColor(w.risk_multiplier)}20`, borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: multiplierColor(w.risk_multiplier) }}>{w.days_until}</div>
                  <div style={{ fontSize: 9, color: 'var(--text2)' }}>days</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{w.event}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    {w.date} · Expected threats: {w.threat_types?.join(', ')?.replace(/_/g, ' ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: multiplierColor(w.risk_multiplier), fontSize: 16 }}>{w.risk_multiplier}x</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>multiplier</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annual heatmap */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 16 }}>Annual Threat Heatmap</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {MONTH_NAMES.map((month, idx) => {
            const monthNum = idx + 1
            const events = data.risk_calendar?.filter(e => e.month === monthNum) || []
            const maxMult = events.length ? Math.max(...events.map(e => e.risk_multiplier)) : 1
            const color = multiplierColor(maxMult)
            const label = riskLabel(maxMult)
            return (
              <div key={month} style={{
                background: `${color}15`, border: `1px solid ${color}40`,
                borderRadius: 8, padding: '10px 12px'
              }}>
                <div style={{ fontWeight: 700, color, fontSize: 13 }}>{month}</div>
                {events.length > 0 ? (
                  <>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4, lineHeight: 1.4 }}>
                      {events[0].event}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 4 }}>{maxMult}x · {label}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>Normal · 1x</div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--text2)' }}>
          {[['#22c55e', 'NORMAL (1x)'], ['#eab308', 'ELEVATED (1.5x+)'], ['#f97316', 'HIGH (2x+)'], ['#ef4444', 'CRITICAL (2.5x+)']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
