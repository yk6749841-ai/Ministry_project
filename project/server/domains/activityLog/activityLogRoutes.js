// Activity Log domain — HTTP surface. GET /reports/:id/activity (settlement-scoped).
import * as buildingService from '../buildings/buildingService.js'
import { inSettlementScope } from '../users/permissions.js'
import * as usersService from '../users/usersService.js'
import * as activityLogService from './activityLogService.js'

export const activityLogRoutes = [
  {
    method: 'GET',
    pattern: /^\/reports\/([^/]+)\/activity$/,
    handle([id], req) {
      const building = buildingService.getRawBuilding(id)
      if (!building) return { status: 404, body: { error: 'Report not found' } }
      if (!inSettlementScope(usersService.userForRequest(req), building.settlementId)) {
        return { status: 403, body: { error: 'המבנה אינו בתחום האחריות שלך' } }
      }
      return { status: 200, body: activityLogService.listForBuilding(id) }
    },
  },
]
