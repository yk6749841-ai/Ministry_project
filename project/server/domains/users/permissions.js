// Role → allowed business actions. The Users domain owns this policy; routes
// call usersService.authorize() before performing an action.

export const ROLES = ['MINISTRY', 'MUNICIPALITY', 'APPRAISER']

export const ACTIONS = {
  UPDATE_ASSESSMENT: 'UPDATE_ASSESSMENT',
  DECIDE_MUNICIPAL_APPROVAL: 'DECIDE_MUNICIPAL_APPROVAL',
  OPEN_BUDGET_REQUEST: 'OPEN_BUDGET_REQUEST',
}

const ALLOWED = {
  MINISTRY: [
    ACTIONS.UPDATE_ASSESSMENT,
    ACTIONS.DECIDE_MUNICIPAL_APPROVAL,
    ACTIONS.OPEN_BUDGET_REQUEST,
  ],
  MUNICIPALITY: [ACTIONS.DECIDE_MUNICIPAL_APPROVAL],
  APPRAISER: [ACTIONS.UPDATE_ASSESSMENT],
}

export const can = (role, action) => (ALLOWED[role] ?? []).includes(action)

// Area-of-responsibility check. MUNICIPALITY users are limited to their own
// settlement; MINISTRY / APPRAISER (and unauthenticated reads) are not scoped.
export const inSettlementScope = (user, buildingSettlementId) =>
  !user || user.role !== 'MUNICIPALITY' || user.settlementId === buildingSettlementId
