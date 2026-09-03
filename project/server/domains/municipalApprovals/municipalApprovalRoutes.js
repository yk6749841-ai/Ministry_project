// Municipal Approvals domain — HTTP surface. Checks the caller's role (via the
// Users API) before writing anything; only records an activity entry on success.
import { readJsonBody } from '../../shared/http.js'
import * as activityLogService from '../activityLog/activityLogService.js'
import * as buildingService from '../buildings/buildingService.js'
import { ACTIONS } from '../users/permissions.js'
import * as usersService from '../users/usersService.js'
import * as municipalApprovalService from './municipalApprovalService.js'

export const municipalApprovalRoutes = [
  {
    method: 'PATCH',
    pattern: /^\/reports\/([^/]+)\/authority-approval$/,
    async handle([id], req) {
      const building = buildingService.getRawBuilding(id)
      if (!building) return { status: 404, body: { error: 'Report not found' } }
      const auth = usersService.authorize(
        req,
        ACTIONS.DECIDE_MUNICIPAL_APPROVAL,
        building.settlementId,
      )
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } }
      const body = await readJsonBody(req)
      const { approval } = municipalApprovalService.saveApproval(id, body)
      activityLogService.record({
        user: auth.user,
        action: approval.approved ? 'אישור מבנה' : 'דחיית מבנה',
        entityType: 'MUNICIPAL_APPROVAL',
        entityId: id,
      })
      return { status: 200, body: buildingService.getBuilding(id) }
    },
  },
]
