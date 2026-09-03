// Municipal Approvals domain — public API. Other domains read approvals only
// through getApproval(); nobody else may write one.
import { toBool, trimStr } from '../../shared/coerce.js'
import * as store from './municipalApprovalStore.js'

export function getApproval(buildingId) {
  return store.get(buildingId)
}

export function saveApproval(buildingId, input) {
  const approval = {
    waterOk: toBool(input.waterOk),
    electricityOk: toBool(input.electricityOk),
    accessRoadsOpen: toBool(input.accessRoadsOpen),
    hazardsCleared: toBool(input.hazardsCleared),
    notes: trimStr(input.notes),
    approved: toBool(input.approved),
    savedAt: new Date().toISOString(),
  }
  store.set(buildingId, approval)
  return { ok: true, approval }
}
