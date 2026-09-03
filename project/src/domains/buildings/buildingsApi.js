// Buildings domain — client API. Buildings own building core data + the
// rehabilitation process.
import { request } from '../../shared/apiClient'

export const listReports = () => request('/reports')

export const getReport = (id) => request(`/reports/${id}`)

export const createReport = (payload) =>
  request('/reports', { method: 'POST', body: JSON.stringify(payload) })

export const updateReportStatus = (id, status) =>
  request(`/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

export const openBudgetRequest = (id) =>
  request(`/reports/${id}/budget-request`, { method: 'POST' })

export const getReportActivity = (id) => request(`/reports/${id}/activity`)
