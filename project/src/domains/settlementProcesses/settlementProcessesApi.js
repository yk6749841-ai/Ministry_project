// Settlement Processes domain — client API.
import { request } from '../../shared/apiClient'

export const listSettlementProcesses = () => request('/settlement-processes')

export const startSettlementProcess = (settlementName, eligibleCount) =>
  request('/settlement-processes', {
    method: 'POST',
    body: JSON.stringify({ settlementName, eligibleCount }),
  })

export const completeSettlementProcess = (id) =>
  request(`/settlement-processes/${id}/complete`, { method: 'PATCH' })

export const reportSettlementProcessFailure = (id, settlementName, errorMessage) =>
  request(`/settlement-processes/${id}/log`, {
    method: 'POST',
    body: JSON.stringify({ settlementName, errorMessage }),
  })
