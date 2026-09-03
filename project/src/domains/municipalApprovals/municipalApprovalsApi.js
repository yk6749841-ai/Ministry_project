// Municipal Approvals domain — client API. Only the authority system writes
// approvals.
import { request } from '../../shared/apiClient'

export const saveAuthorityApproval = (id, approval) =>
  request(`/reports/${id}/authority-approval`, {
    method: 'PATCH',
    body: JSON.stringify(approval),
  })
