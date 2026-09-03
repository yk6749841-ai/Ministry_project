import { useEffect, useState } from 'react'
import { STATUS_LABELS, nextStatus } from '../../shared/constants'
import StatusBadge from '../../shared/StatusBadge'
import {
  getReport,
  getReportActivity,
  openBudgetRequest,
  updateReportStatus,
} from './buildingsApi'
import { roleCanOpenBudgetRequest } from '../users/permissions'
import { canOpenBudgetRequest, isRehabReady, needsSocialApproval } from './buildingRules'

export default function ReportDetails({ id, role, onBack }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [draftStatus, setDraftStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const [activity, setActivity] = useState([])

  useEffect(() => {
    let active = true
    Promise.all([getReport(id), getReportActivity(id)])
      .then(([data, log]) => {
        if (!active) return
        setReport(data)
        setDraftStatus(data.status)
        setActivity(log)
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
  }, [id])

  const refreshActivity = () =>
    getReportActivity(id)
      .then(setActivity)
      .catch(() => {})

  async function handleSaveStatus() {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    try {
      const updated = await updateReportStatus(id, draftStatus)
      setReport(updated)
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleOpenBudgetRequest() {
    setBudgetSaving(true)
    setBudgetError('')
    try {
      const updated = await openBudgetRequest(id)
      setReport(updated)
      refreshActivity()
    } catch (err) {
      setBudgetError(err.message)
    } finally {
      setBudgetSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="card">
        <p className="muted">טוען…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="card">
        <header className="card__head">
          <h1>דיווח</h1>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            חזרה לרשימה
          </button>
        </header>
        <p className="alert alert--error">{error}</p>
      </section>
    )
  }

  const upcomingStatus = nextStatus(report.status)
  const statusOptions = upcomingStatus ? [report.status, upcomingStatus] : [report.status]
  const statusChanged = draftStatus !== report.status

  const rehabReady = isRehabReady(report)
  const socialApprovalMissing = needsSocialApproval(report)
  const roleAllowsBudget = roleCanOpenBudgetRequest(role)
  const budgetAllowed = canOpenBudgetRequest(report) && roleAllowsBudget
  const budgetRequestOpened = Boolean(report.budgetRequestOpened)

  return (
    <section className="card">
      <header className="card__head">
        <div>
          <h1>{report.damageType}</h1>
          <p className="muted">מבנה {report.id}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          חזרה לרשימה
        </button>
      </header>

      <dl className="detail-grid">
        <div>
          <dt>סטטוס</dt>
          <dd>
            <StatusBadge status={report.status} />
          </dd>
        </div>
        <div>
          <dt>מוסר הדיווח</dt>
          <dd>{report.reporterName}</dd>
        </div>
        <div>
          <dt>כתובת</dt>
          <dd>{report.address}</dd>
        </div>
        <div>
          <dt>אימייל משפחה</dt>
          <dd>{report.familyEmail || '—'}</dd>
        </div>
        <div>
          <dt>נוצר בתאריך</dt>
          <dd>{new Date(report.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>מספר דירות במבנה</dt>
          <dd>{report.apartmentsInBuilding}</dd>
        </div>
        <div>
          <dt>תמונות נזק</dt>
          <dd>{report.hasDamagePhotos ? 'כן' : 'לא'}</dd>
        </div>
        <div>
          <dt>דו"ח מהנדס</dt>
          <dd>{report.hasEngineerReport ? 'כן' : 'לא'}</dd>
        </div>
        <div>
          <dt>בדיקת זכאות</dt>
          <dd>{report.eligibilityChecked ? 'בוצעה' : 'לא בוצעה'}</dd>
        </div>
        <div>
          <dt>אישור חברתי</dt>
          <dd>{report.socialApproval ? 'כן' : 'לא'}</dd>
        </div>
        <div className="detail-grid__full">
          <dt>תיאור</dt>
          <dd>{report.description}</dd>
        </div>
      </dl>

      <div className="assessment-section" dir="rtl">
        <h2>הערכת שמאי</h2>
        {report.assessment ? (
          <dl className="detail-grid">
            <div>
              <dt>דרגת נזק</dt>
              <dd>{report.assessment.damageGrade}</dd>
            </div>
            <div>
              <dt>תאריך בדיקה</dt>
              <dd>{report.assessment.inspectionDate}</dd>
            </div>
            <div>
              <dt>נדרשת בדיקה חוזרת</dt>
              <dd>{report.assessment.reinspectionRequired ? 'כן' : 'לא'}</dd>
            </div>
            <div className="detail-grid__full">
              <dt>הערות שמאי</dt>
              <dd>{report.assessment.notes || '—'}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">טרם בוצעה הערכת שמאי.</p>
        )}
      </div>

      <div className="assessment-section" dir="rtl">
        <h2>אישור רשות מקומית</h2>
        {report.authorityApproval ? (
          <dl className="detail-grid">
            <div>
              <dt>אספקת מים תקינה</dt>
              <dd>{report.authorityApproval.waterOk ? 'כן' : 'לא'}</dd>
            </div>
            <div>
              <dt>אספקת חשמל תקינה</dt>
              <dd>{report.authorityApproval.electricityOk ? 'כן' : 'לא'}</dd>
            </div>
            <div>
              <dt>דרכי גישה פתוחות</dt>
              <dd>{report.authorityApproval.accessRoadsOpen ? 'כן' : 'לא'}</dd>
            </div>
            <div>
              <dt>מפגעים סביבתיים פונו</dt>
              <dd>{report.authorityApproval.hazardsCleared ? 'כן' : 'לא'}</dd>
            </div>
            <div>
              <dt>אישור רשות מקומית</dt>
              <dd>{report.authorityApproval.approved ? 'כן' : 'לא'}</dd>
            </div>
            <div className="detail-grid__full">
              <dt>הערות הרשות המקומית</dt>
              <dd>{report.authorityApproval.notes || '—'}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">טרם התקבל אישור רשות מקומית.</p>
        )}
      </div>

      <div className="assessment-section" dir="rtl">
        <h2>היסטוריית פעולות</h2>
        {activity.length === 0 ? (
          <p className="muted">לא בוצעו פעולות.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>תאריך ושעה</th>
                  <th>משתמש</th>
                  <th>פעולה</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td>{entry.userName}</td>
                    <td>{entry.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p
        dir="rtl"
        className={`alert ${rehabReady ? 'alert--ok' : 'alert--warn'} rehab-indicator`}
      >
        {rehabReady ? 'ניתן להתחיל שיקום' : 'חסר מידע להתחלת שיקום'}
      </p>

      <div className="budget-request" dir="rtl">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleOpenBudgetRequest}
          disabled={!budgetAllowed || budgetRequestOpened || budgetSaving}
        >
          {budgetSaving ? 'פותח…' : 'פתח בקשת תקציב'}
        </button>
        {!roleAllowsBudget && (
          <p className="muted">לתפקידך אין הרשאה לפתוח בקשת תקציב.</p>
        )}
        {roleAllowsBudget && !rehabReady && (
          <p className="muted">לא ניתן לפתוח בקשת תקציב — חסרים נתונים (תמונות נזק, דו"ח מהנדס, בדיקת זכאות).</p>
        )}
        {roleAllowsBudget && rehabReady && socialApprovalMissing && (
          <p className="muted">
            לא ניתן לפתוח בקשת תקציב — למבנה יש יותר מ-24 דירות ונדרש אישור חברתי.
          </p>
        )}
        {budgetError && <p className="alert alert--error">{budgetError}</p>}
        {budgetRequestOpened && <p className="alert alert--ok">בקשת תקציב נפתחה.</p>}
      </div>

      <div className="status-editor">
        <label className="field">
          <span className="field__label">שינוי סטטוס</span>
          <select
            className="field__input"
            value={draftStatus}
            onChange={(event) => {
              setDraftStatus(event.target.value)
              setSaved(false)
            }}
            disabled={!upcomingStatus || saving}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSaveStatus}
          disabled={saving}
        >
          {saving ? 'שומר…' : 'שמור סטטוס'}
        </button>
      </div>

      {!upcomingStatus && (
        <p className="muted">הדיווח הגיע לסטטוס הסופי.</p>
      )}
      {saveError && <p className="alert alert--error">{saveError}</p>}
      {saved && !statusChanged && <p className="alert alert--ok">הסטטוס עודכן.</p>}
    </section>
  )
}
