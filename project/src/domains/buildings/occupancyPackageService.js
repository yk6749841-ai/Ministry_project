// "שרות תיק אכלוס" — Occupancy Package Service (client side).
// Owns the rule for when a Return-Home package may be produced and the call to
// the generation API. It composes the shared business rules; it does not
// redefine them.
import { STATUS } from '../../shared/constants'
import { request } from '../../shared/apiClient'
import { hasBudgetRequest, isQueuedForWork } from './buildingRules'

// Requirement: engineer report + eligibility check + a budget request exists +
// rehabilitation finished.
export const canGenerateReturnHomePackage = (report) =>
  isQueuedForWork(report) &&
  hasBudgetRequest(report) &&
  report.status === STATUS.REHAB_DONE

export function generateReturnHomePackage(reportId, settlementProcessId) {
  return request(`/buildings/${reportId}/return-home-package`, {
    method: 'POST',
    headers: settlementProcessId
      ? { 'X-Settlement-Process-Id': settlementProcessId }
      : undefined,
  })
}
