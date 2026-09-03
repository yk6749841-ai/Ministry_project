// Role → UI capability. Mirrors the server's policy; used only to hide/disable
// actions. The server is the source of truth and rejects blocked requests.

export const roleCanUpdateAssessment = (role) =>
  role === 'MINISTRY' || role === 'APPRAISER'

export const roleCanDecideApproval = (role) =>
  role === 'MINISTRY' || role === 'MUNICIPALITY'

export const roleCanOpenBudgetRequest = (role) => role === 'MINISTRY'

export const roleCanViewAssessorPortal = roleCanUpdateAssessment
export const roleCanViewMunicipalPortal = roleCanDecideApproval
