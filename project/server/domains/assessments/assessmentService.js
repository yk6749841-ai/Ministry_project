// Assessments domain — public API. Other domains read assessments only through
// getAssessment(); nobody else may write one.
import { toBool, trimStr } from '../../shared/coerce.js'
import * as store from './assessmentStore.js'

export const DAMAGE_GRADES = ['קל', 'בינוני', 'חמור']

export function getAssessment(buildingId) {
  return store.get(buildingId)
}

export function saveAssessment(buildingId, input) {
  if (!DAMAGE_GRADES.includes(input.damageGrade)) {
    return { ok: false, error: `damageGrade must be one of: ${DAMAGE_GRADES.join(', ')}` }
  }
  if (!trimStr(input.inspectionDate)) {
    return { ok: false, error: 'inspectionDate is required' }
  }
  const assessment = {
    damageGrade: input.damageGrade,
    notes: trimStr(input.notes),
    inspectionDate: trimStr(input.inspectionDate),
    reinspectionRequired: toBool(input.reinspectionRequired),
    savedAt: new Date().toISOString(),
  }
  store.set(buildingId, assessment)
  return { ok: true, assessment }
}
