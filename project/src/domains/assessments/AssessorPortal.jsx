import { useEffect, useState } from 'react'
import StatusBadge from '../../shared/StatusBadge'
import { listReports } from '../buildings/buildingsApi'
import { localityOf } from '../buildings/buildingRules'
import { saveAssessment } from './assessmentsApi'

const DAMAGE_GRADES = ['קל', 'בינוני', 'חמור']

const EMPTY_ASSESSMENT = {
  damageGrade: '',
  notes: '',
  inspectionDate: '',
  reinspectionRequired: false,
}

export default function AssessorPortal({ onBack }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY_ASSESSMENT)
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
    setForm(
      report.assessment
        ? {
            damageGrade: report.assessment.damageGrade,
            notes: report.assessment.notes,
            inspectionDate: report.assessment.inspectionDate,
            reinspectionRequired: report.assessment.reinspectionRequired,
          }
        : EMPTY_ASSESSMENT,
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      const updated = await saveAssessment(selectedId, {
        damageGrade: form.damageGrade,
        notes: form.notes.trim(),
        inspectionDate: form.inspectionDate,
        reinspectionRequired: form.reinspectionRequired,
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

  const canSubmit = Boolean(form.damageGrade) && Boolean(form.inspectionDate) && !saving

  return (
    <section className="card">
      <header className="card__head">
        <div>
          <h1>פורטל שמאים</h1>
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
          הערכת השמאי נשמרה.
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
                <th>הערכת שמאי קיימת</th>
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
                  <td>{report.assessment ? 'כן' : 'לא'}</td>
                  <td className="table__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => openForm(report)}
                    >
                      {report.assessment ? 'עדכן הערכה' : 'הזן הערכה'}
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
            <h2>הערכת נזק — {selected.address}</h2>

            <form className="form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="field__label">דרגת נזק</span>
                <select
                  className="field__input"
                  value={form.damageGrade}
                  onChange={(event) => setField('damageGrade', event.target.value)}
                  required
                >
                  <option value="">בחר…</option>
                  {DAMAGE_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">תאריך בדיקה</span>
                <input
                  className="field__input"
                  type="date"
                  value={form.inspectionDate}
                  onChange={(event) => setField('inspectionDate', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">הערות שמאי</span>
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
                  checked={form.reinspectionRequired}
                  onChange={(event) => setField('reinspectionRequired', event.target.checked)}
                />
                <span>נדרשת בדיקה חוזרת</span>
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
                <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
                  {saving ? 'שומר…' : 'שמור הערכה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
