import { useEffect, useState } from 'react'
import { getSystemHealth } from './systemHealthApi'

function formatDuration(ms) {
  if (!ms) return '—'
  return `${(ms / 1000).toFixed(1)} שנ׳`
}

function MetricGroup({ title, items }) {
  return (
    <div className="locality-summary">
      <h2>{title}</h2>
      <div className="locality-summary__grid">
        {items.map(([label, value]) => (
          <div key={label} className="locality-summary__item">
            <span className="locality-summary__value">{value}</span>
            <span className="locality-summary__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SystemHealth({ onBack }) {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getSystemHealth()
      .then((data) => {
        if (active) setHealth(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="card">
      <header className="card__head">
        <h1>בריאות המערכת</h1>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          חזרה לרשימה
        </button>
      </header>

      {loading && <p className="muted">טוען…</p>}
      {error && <p className="alert alert--error">{error}</p>}

      {health && (
        <>
          <MetricGroup
            title="תהליכי יישוב"
            items={[
              ['הושלמו', health.settlementProcesses.completed],
              ['בתהליך', health.settlementProcesses.processing],
            ]}
          />
          <MetricGroup
            title="הודעות"
            items={[
              ['נשלחו בהצלחה', health.notifications.successful],
              ['נכשלו', health.notifications.failed],
              ['מספר ניסיונות חוזרים', health.notifications.retryCount],
            ]}
          />
          <MetricGroup
            title="ביצועים"
            items={[
              [
                'משך תהליך יישוב ממוצע',
                formatDuration(health.performance.averageSettlementDurationMs),
              ],
            ]}
          />
        </>
      )}
    </section>
  )
}
