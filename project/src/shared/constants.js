export const STATUS = {
  WAITING_FOR_VALIDATION: 'WAITING_FOR_VALIDATION',
  NEW: 'NEW',
  IN_REVIEW: 'IN_REVIEW',
  REHAB_IN_PROGRESS: 'REHAB_IN_PROGRESS',
  REHAB_DONE: 'REHAB_DONE',
}

// Ordered progression a report moves through. Order matters: a report can only
// advance to the next status in this list (see nextStatus).
export const STATUS_FLOW = [
  STATUS.WAITING_FOR_VALIDATION,
  STATUS.NEW,
  STATUS.IN_REVIEW,
  STATUS.REHAB_IN_PROGRESS,
  STATUS.REHAB_DONE,
]

// Every status the API accepts.
export const STATUSES = STATUS_FLOW

export const STATUS_LABELS = {
  WAITING_FOR_VALIDATION: 'ממתין לאימות',
  NEW: 'חדש',
  IN_REVIEW: 'בבדיקה',
  REHAB_IN_PROGRESS: 'מבנה בתהליך שיקום',
  REHAB_DONE: 'תהליך שיקום הסתיים',
}

// The single status a report in `current` is allowed to move to, or null if it
// is already at the end of the flow.
export function nextStatus(current) {
  const index = STATUS_FLOW.indexOf(current)
  if (index === -1 || index === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[index + 1]
}
