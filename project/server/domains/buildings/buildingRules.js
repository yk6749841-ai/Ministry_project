// Buildings domain — core building + rehabilitation-process rules.

// Ordered rehabilitation progression. A building may only move to the status
// immediately after its current one (or stay put). Index 0 is the initial one.
export const STATUS_FLOW = [
  'WAITING_FOR_VALIDATION',
  'NEW',
  'IN_REVIEW',
  'REHAB_IN_PROGRESS',
  'REHAB_DONE',
]
export const STATUSES = STATUS_FLOW
export const INITIAL_STATUS = STATUS_FLOW[0]

export function nextStatus(current) {
  const index = STATUS_FLOW.indexOf(current)
  if (index === -1 || index === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[index + 1]
}

export const isRehabReady = (building) =>
  building.hasDamagePhotos && building.hasEngineerReport && building.eligibilityChecked

// Regulation: buildings with more than 24 apartments need social approval before
// a budget request can be opened.
export const needsSocialApproval = (building) =>
  building.apartmentsInBuilding > 24 && !building.socialApproval

export const canOpenBudgetRequest = (building) =>
  isRehabReady(building) && !needsSocialApproval(building)

export const hasBudgetRequest = (building) => Boolean(building.budgetRequestOpened)

export const isQueuedForWork = (building) =>
  building.hasEngineerReport && building.eligibilityChecked

// The locality is the last comma-separated part of the address.
export const localityOf = (address) => String(address).split(',').pop().trim()
