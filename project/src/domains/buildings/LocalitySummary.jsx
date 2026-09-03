import {
  hasAssessorAssessment,
  hasLocalAuthorityApproval,
  isReadyForLocalityOpening,
} from './buildingRules'

export default function LocalitySummary({ locality, reports }) {
  const ready = reports.filter(isReadyForLocalityOpening)
  const notReady = reports.filter((report) => !isReadyForLocalityOpening(report))

  // Partition the not-ready buildings by their next blocker.
  const waitingAssessor = notReady.filter((report) => !hasAssessorAssessment(report))
  const waitingAuthority = notReady.filter(
    (report) => hasAssessorAssessment(report) && !hasLocalAuthorityApproval(report),
  )
  const otherReasons = notReady.filter(
    (report) => hasAssessorAssessment(report) && hasLocalAuthorityApproval(report),
  )

  const items = [
    ['סה"כ מבנים ביישוב', reports.length],
    ['כשירים לפתיחת יישוב', ready.length],
    ['אינם כשירים לפתיחת יישוב', notReady.length],
    ['ממתינים להערכת שמאי', waitingAssessor.length],
    ['ממתינים לאישור הרשות המקומית', waitingAuthority.length],
    ['אינם כשירים מסיבות אחרות', otherReasons.length],
  ]

  return (
    <div className="locality-summary" dir="rtl">
      <h2>מצב היישוב — {locality}</h2>
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
