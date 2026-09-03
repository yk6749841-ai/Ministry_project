import { useEffect, useState } from 'react'
import StatusBadge from '../../shared/StatusBadge'
import { listReports } from '../buildings/buildingsApi'
import { localityOf } from '../buildings/buildingRules'
import { saveAuthorityApproval } from './municipalApprovalsApi'

const CHECK_FIELDS = [
  { name: 'waterOk', label: 'אספקת מים תקינה' },
  { name: 'electricityOk', label: 'אספקת חשמל תקינה' },
  { name: 'accessRoadsOpen', label: 'דרכי גישה פתוחות' },
  { name: 'hazardsCleared', label: 'מפגעים סביבתיים פונו' },
]

const EMPTY_APPROVAL = {
  waterOk: false,
  electricityOk: false,
  accessRoadsOpen: false,
  hazardsCleared: false,
  notes: '',
  approved: false,
}

export default function LocalAuthorityPortal({ onBack }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY_APPROVAL)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    listReports()
      .then((data) => {
        if (active) setReports(data)
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

  const selected = reports.find((report) => report.id === selectedId) ?? null
  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  function openForm(report) {
    setSelectedId(report.id)
    setSaved(false)
    setSaveError('')
    setForm(report.authorityApproval ? { ...report.authorityApproval } : EMPTY_APPROVAL)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      const updated = await saveAuthorityApproval(selectedId, {
        waterOk: form.waterOk,
        electricityOk: form.electricityOk,
        accessRoadsOpen: form.accessRoadsOpen,
        hazardsCleared: form.hazardsCleared,
        notes: form.notes.trim(),
        approved: form.approved,
      })
      setReports((prev) => prev.map((report) => (report.id === updated.id ? updated : report)))
      setSelectedId(null)
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card">
      <header className="card__head">
        <div>
          <h1>פורטל רשויות מקומיות</h1>
          {!loading && !error && <p className="muted">{reports.length} מבנים</p>}
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          חזרה לרשימה
        </button>
      </header>

      {loading && <p className="muted">טוען…</p>}
      {error && <p className="alert alert--error">{error}</p>}
      {saved && (
        <p className="alert alert--ok" dir="rtl">
          נתוני הרשות המקומית נשמרו.
        </p>
      )}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>כתובת המבנה</th>
                <th>יישוב</th>
                <th>סטטוס טיפול</th>
                <th>אישור רשות קיים</th>
                <th aria-label="פעולות" />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.address}</td>
                  <td>{localityOf(report.address)}</td>
                  <td>
                    <StatusBadge status={report.status} />
                  </td>
                  <td>{report.authorityApproval ? 'כן' : 'לא'}</td>
                  <td className="table__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => openForm(report)}
                    >
                      {report.authorityApproval ? 'עדכן' : 'עדכן מצב תשתיות'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal--form" dir="rtl">
            <h2>מצב תשתיות וסביבה — {selected.address}</h2>

            <form className="form" onSubmit={handleSubmit}>
              <fieldset className="check-group">
                {CHECK_FIELDS.map((field) => (
                  <label key={field.name} className="check">
                    <input
                      type="checkbox"
                      checked={form[field.name]}
                      onChange={(event) => setField(field.name, event.target.checked)}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </fieldset>

              <label className="field">
                <span className="field__label">הערות הרשות המקומית</span>
                <textarea
                  className="field__input"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                />
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={form.approved}
                  onChange={(event) => setField('approved', event.target.checked)}
                />
                <span>אישור רשות מקומית</span>
              </label>

              {saveError && <p className="alert alert--error">{saveError}</p>}

              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setSelectedId(null)}
                >
                  ביטול
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'שומר…' : 'שמור'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
