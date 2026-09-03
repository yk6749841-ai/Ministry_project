// National dashboard rule (owned by the Buildings domain): is a building ready
// for its locality to reopen? `assessment` and `approval` are passed in by the
// caller, which obtains them from the Assessments / Municipal Approvals domain
// APIs — this module never reaches into another domain's data itself.
import { hasBudgetRequest, isRehabReady, needsSocialApproval } from './buildingRules.js'

export function readyForLocalityOpening(building, assessment, approval) {
  const gradeAllowsOpening =
    assessment?.damageGrade === 'קל' || assessment?.damageGrade === 'בינוני'
  return (
    isRehabReady(building) && // damage photos + engineer report + eligibility check
    !needsSocialApproval(building) && // social approval obtained if it was required
    hasBudgetRequest(building) &&
    Boolean(building.returnHomePackageGeneratedAt) && // return-home package produced
    Boolean(assessment) && // assessor assessment exists
    gradeAllowsOpening && // damage grade is קל / בינוני
    approval?.approved === true // local authority approval granted
  )
}
