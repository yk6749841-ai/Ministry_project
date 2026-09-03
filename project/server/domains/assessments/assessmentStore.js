// Owned by the Assessments domain. Private — only assessmentService touches it.
import { seedAssessments } from '../../seed.js'

const assessments = new Map(seedAssessments) // buildingId -> assessment

export const get = (buildingId) => assessments.get(buildingId) ?? null

export const set = (buildingId, assessment) => {
  assessments.set(buildingId, assessment)
}
