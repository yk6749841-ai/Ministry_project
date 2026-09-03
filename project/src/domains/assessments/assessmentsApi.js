// Assessments domain — client API. Only the assessor system writes assessments.
import { request } from '../../shared/apiClient'

export const saveAssessment = (id, assessment) =>
  request(`/reports/${id}/assessment`, { method: 'PATCH', body: JSON.stringify(assessment) })
