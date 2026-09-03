import { useEffect, useState } from 'react'
import { listSettlementProcesses } from './settlementProcessesApi'

const STATUS_LABELS = { PROCESSING: 'בתהליך', COMPLETED: 'הושלם' }

export default function SettlementProcesses({ onBack }) {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listSettlementProcesses()
      .then((data) => {
        if (active) setProcesses(data)
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
        <div>
          <h1>תהליכי יישוב</h1>
          {!loading && !error && (
            <p className="muted">{processes.length} תהליכים</p>
          )}
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          חזרה לרשימה
        </button>
      </header>

      {loading && <p className="muted">טוען…</p>}
      {error && <p className="alert alert--error">{error}</p>}

      {!loading && !error && processes.length === 0 && (
        <p className="muted">אין תהליכי יישוב עדיין.</p>
      )}

      {!loading && !error && processes.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>יישוב</th>
                <th>הופעל על ידי</th>
                <th>זמן התחלה</th>
                <th>זמן סיום</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process) => (
                <tr key={process.id}>
                  <td>{process.settlementName}</td>
                  <td>{process.startedBy}</td>
                  <td>{new Date(process.startedAt).toLocaleString()}</td>
                  <td>
                    {process.completedAt
                      ? new Date(process.completedAt).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    <span className={`badge badge--${process.status.toLowerCase()}`}>
                      {STATUS_LABELS[process.status] ?? process.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
