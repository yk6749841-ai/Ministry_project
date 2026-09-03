// Buildings domain — client-side rules. Owns building core conditions, the
// rehabilitation checks, and the national-dashboard readiness reading.

export const isRehabReady = (report) =>
  report.hasDamagePhotos && report.hasEngineerReport && report.eligibilityChecked

// Regulation: buildings with more than 24 apartments need social approval before
// a budget request can be opened.
export const needsSocialApproval = (report) =>
  report.apartmentsInBuilding > 24 && !report.socialApproval

export const canOpenBudgetRequest = (report) =>
  isRehabReady(report) && !needsSocialApproval(report)

export const hasBudgetRequest = (report) => Boolean(report.budgetRequestOpened)

// A building is queued for work once an engineer report exists and the
// eligibility check has been done.
export const isQueuedForWork = (report) =>
  report.hasEngineerReport && report.eligibilityChecked

// The locality is the last comma-separated part of the address.
export const localityOf = (address) => String(address).split(',').pop().trim()

// --- National-dashboard readiness ----------------------------------------
// The "כשיר לפתיחת יישוב" verdict is computed by the Buildings service on the
// server (from data it obtains via the Assessments / Municipal Approvals APIs)
// and delivered on the report. The dashboard just reads it.

export const isReadyForLocalityOpening = (report) => report.readyForLocalityOpening === true

// Used only to bucket the *not-ready* buildings in the summary. Reads fields
// composed onto the report from the other domains' APIs.
export const hasAssessorAssessment = (report) => Boolean(report.assessment)

export const hasLocalAuthorityApproval = (report) =>
  report.authorityApproval?.approved === true
