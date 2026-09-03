import { useEffect, useState } from 'react'
import { listReports } from './buildingsApi'
import {
  getNotificationMode,
  listNotifications,
  setNotificationMode,
} from './notificationsApi'

const MODE_OPTIONS = [
  { value: 'SUCCESS', label: 'הצלחה' },
  { value: 'ALWAYS_FAIL', label: 'כשל תמידי' },
  { value: 'FAIL_FIRST', label: 'כשל בניסיון הראשון' },
  { value: 'RANDOM', label: 'כשל אקראי (~30%)' },
  { value: 'RESPONSE_LOST', label: 'אובדן תשובה (Timeout)' },
]

const STATUS_LABELS = { SENT: 'נשלחה', FAILED: 'נכשלה' }

export default function NotificationCenter({ onBack }) {
  const [rows, setRows] = useState([])
  const [addressById, setAddressById] = useState({})
  const [mode, setMode] = useState('SUCCESS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listNotifications(), listReports(), getNotificationMode()])
      .then(([notifications, reports, modeResult]) => {
        if (!active) return
        setRows(notifications)
        setAddressById(Object.fromEntries(reports.map((report) => [report.id, report.address])))
        setMode(modeResult.mode)
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

  async function handleModeChange(event) {
    const next = event.target.value
    setMode(next)
    try {
      await setNotificationMode(next)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="card">
      <header className="card__head">
        <div>
          <h1>מרכז הודעות</h1>
          {!loading && !error && (
            <p className="muted">
              {rows.length} הודע{rows.length === 1 ? 'ה' : 'ות'}
            </p>
          )}
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          חזרה לרשימה
        </button>
      </header>

      <div className="notif-mode" dir="rtl">
        <label className="field">
          <span className="field__label">מצב שרת ההודעות</span>
          <select className="field__input" value={mode} onChange={handleModeChange}>
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="muted">טוען…</p>}
      {error && <p className="alert alert--error">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="muted">עדיין לא נשלחו הודעות.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>מזהה הודעה</th>
                <th>מזהה מבנה</th>
                <th>מפתח ייחודיות</th>
                <th>כתובת המבנה</th>
                <th>כתובת המייל</th>
                <th>נושא</th>
                <th>תאריך ושעה</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.messageId}>
                  <td>{row.messageId}</td>
                  <td>{row.buildingId}</td>
                  <td>{row.idempotencyKey ?? '—'}</td>
                  <td>{addressById[row.buildingId] ?? '—'}</td>
                  <td>{row.email}</td>
                  <td>{row.subject}</td>
                  <td>{new Date(row.sentAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge--${row.status.toLowerCase()}`}>
                      {STATUS_LABELS[row.status] ?? row.status}
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
