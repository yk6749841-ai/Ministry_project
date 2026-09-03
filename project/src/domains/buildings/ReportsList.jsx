import { useEffect, useState } from 'react'
import StatusBadge from '../../shared/StatusBadge'
import { listReports } from './buildingsApi'
import {
  isQueuedForWork,
  isReadyForLocalityOpening,
  isRehabReady,
  localityOf,
} from './buildingRules'
import {
  roleCanViewAssessorPortal,
  roleCanViewMunicipalPortal,
} from '../users/permissions'
import LocalitySummary from './LocalitySummary'
import ReturnHomePackageButton from './ReturnHomePackageButton'
import {
  completeSettlementProcess,
  reportSettlementProcessFailure,
  startSettlementProcess,
} from '../settlementProcesses/settlementProcessesApi'
import {
  canGenerateReturnHomePackage,
  generateReturnHomePackage,
} from './occupancyPackageService'

export default function ReportsList({
  role,
  onOpen,
  onCreate,
  onOpenNotifications,
  onOpenAssessorPortal,
  onOpenAuthorityPortal,
  onOpenSettlementProcesses,
  onOpenSystemHealth,
}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [onlyQueued, setOnlyQueued] = useState(false)
  const [onlyBudgetReady, setOnlyBudgetReady] = useState(false)
  const [localityFilter, setLocalityFilter] = useState('')

  const [bulkPhase, setBulkPhase] = useState('idle') // idle | running | done
  const [bulkCount, setBulkCount] = useState(0)
  const [bulkUrls, setBulkUrls] = useState({}) // { [reportId]: documentUrl }

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

  const refreshReports = () =>
    listReports()
      .then(setReports)
      .catch(() => {})

  const localities = [...new Set(reports.map((report) => localityOf(report.address)))].sort(
    (a, b) => a.localeCompare(b, 'he'),
  )

  const localityReports = localityFilter
    ? reports.filter((report) => localityOf(report.address) === localityFilter)
    : []

  const visibleReports = reports.filter(
    (report) =>
      (!localityFilter || localityOf(report.address) === localityFilter) &&
      (!onlyQueued || isQueuedForWork(report)) &&
      (!onlyBudgetReady || isRehabReady(report)),
  )
  const eligibleInView = visibleReports.filter(canGenerateReturnHomePackage)
  const ready = !loading && !error

  const bulkLabel = localityFilter
    ? 'הפק תיקי איכלוס לכל היישוב'
    : 'הפק תיקי אכלוס לכל המבנים הזכאים'

  async function handleBulkGenerate() {
    setBulkPhase('running')
    const settlementName = localityFilter || 'כל היישובים'
    const eligible = eligibleInView

    // Track this run as a SettlementProcess. Best-effort — never blocks or
    // alters the existing generation flow.
    let processId = null
    try {
      const process = await startSettlementProcess(settlementName, eligible.length)
      processId = process.id
    } catch (err) {
      console.warn('Could not start settlement process tracking', err)
    }

    try {
      const urls = { ...bulkUrls }
      let produced = 0
      for (const report of eligible) {
        try {
          // Reuse the existing single-building mechanism for each building;
          // pass the process id so its server-side logs are correlated.
          const result = await generateReturnHomePackage(report.id, processId)
          urls[report.id] = result.url
          produced += 1
        } catch (err) {
          console.warn('Package generation failed for', report.id, err)
        }
      }

      if (processId) {
        try {
          await completeSettlementProcess(processId)
        } catch (err) {
          console.warn('Could not complete settlement process tracking', err)
        }
      }

      setBulkUrls(urls)
      setBulkCount(produced)
      setBulkPhase('done')
      // Pull the freshly-marked reports so readiness + summary reflect the new packages.
      await refreshReports()
    } catch (err) {
      // Unhandled failure of the whole settlement run.
      console.error('Settlement process failed', err)
      if (processId) {
        reportSettlementProcessFailure(processId, settlementName, err.message).catch(() => {})
      }
      setBulkPhase('done')
    }
  }

  return (
    <section className="card">
      <header className="card__head">
        <div>
          <h1>דיווחי נזק</h1>
          {ready && <p className="muted">{visibleReports.length} דיווחים</p>}
        </div>
        <div className="card__head-actions">
          {roleCanViewAssessorPortal(role) && (
            <button type="button" className="btn btn--ghost" onClick={onOpenAssessorPortal}>
              פורטל שמאים
            </button>
          )}
          {roleCanViewMunicipalPortal(role) && (
            <button type="button" className="btn btn--ghost" onClick={onOpenAuthorityPortal}>
              פורטל רשויות מקומיות
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onOpenNotifications}>
            מרכז הודעות
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onOpenSettlementProcesses}
          >
            תהליכי יישוב
          </button>
          <button type="button" className="btn btn--ghost" onClick={onOpenSystemHealth}>
            בריאות המערכת
          </button>
          <button type="button" className="btn btn--primary" onClick={onCreate}>
            דיווח חדש
          </button>
        </div>
      </header>

      {loading && <p className="muted">טוען…</p>}
      {error && <p className="alert alert--error">{error}</p>}

      {ready && reports.length === 0 && (
        <p className="muted">אין דיווחים עדיין. צרו את הדיווח הראשון.</p>
      )}

      {ready && reports.length > 0 && (
        <>
          <div className="list-filters">
            <label className="check locality-filter">
              <span>סינון לפי ישוב</span>
              <select
                value={localityFilter}
                onChange={(event) => setLocalityFilter(event.target.value)}
              >
                <option value="">כל היישובים</option>
                {localities.map((locality) => (
                  <option key={locality} value={locality}>
                    {locality}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={onlyQueued}
                onChange={(event) => setOnlyQueued(event.target.checked)}
              />
              <span>הצג רק מבנים בתור לעבודה</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={onlyBudgetReady}
                onChange={(event) => setOnlyBudgetReady(event.target.checked)}
              />
              <span>הצג רק מבנים שניתן לשחרר עבורם תקציב</span>
            </label>
          </div>

          {localityFilter && localityReports.length > 0 && (
            <LocalitySummary locality={localityFilter} reports={localityReports} />
          )}

          <div className="bulk-bar" dir="rtl">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleBulkGenerate}
              disabled={bulkPhase === 'running' || eligibleInView.length === 0}
            >
              {bulkLabel}
            </button>
            <span className="muted">{eligibleInView.length} מבנים זכאים בתצוגה</span>
          </div>

          {visibleReports.length === 0 ? (
            <p className="muted">אין מבנים התואמים לסינון.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>מוסר הדיווח</th>
                    <th>כתובת</th>
                    <th>סוג הנזק</th>
                    <th>סטטוס</th>
                    <th>ממתין בתור לעבודה</th>
                    <th>מוכן לשחרור תקציב</th>
                    <th>כשיר לפתיחת יישוב</th>
                    <th>תיק אכלוס מחדש</th>
                    <th aria-label="פעולות" />
                  </tr>
                </thead>
                <tbody>
                  {visibleReports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.reporterName}</td>
                      <td>{report.address}</td>
                      <td>{report.damageType}</td>
                      <td>
                        <StatusBadge status={report.status} />
                      </td>
                      <td>{isQueuedForWork(report) ? 'כן' : 'לא'}</td>
                      <td>{isRehabReady(report) ? 'כן' : 'לא'}</td>
                      <td>{isReadyForLocalityOpening(report) ? 'כן' : 'לא'}</td>
                      <td>
                        {canGenerateReturnHomePackage(report) || bulkUrls[report.id] ? (
                          <ReturnHomePackageButton
                            reportId={report.id}
                            documentUrl={bulkUrls[report.id] || ''}
                            onGenerated={refreshReports}
                          />
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="table__actions">
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => onOpen(report.id)}
                        >
                          צפייה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {bulkPhase !== 'idle' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal" dir="rtl">
            {bulkPhase === 'running' ? (
              <>
                <div className="spinner" aria-hidden="true" />
                <p className="modal__msg">מפיק תיקים...</p>
              </>
            ) : (
              <>
                <p className="modal__title">ההפקה הושלמה</p>
                <p className="modal__msg">הופקו {bulkCount} תיקי חזרה לבית</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setBulkPhase('idle')}
                >
                  סגור
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
