// Assessments domain — HTTP surface. Checks the caller's role (via the Users
// API) before writing anything; only records an activity entry on success.
import { readJsonBody } from '../../shared/http.js'
import * as activityLogService from '../activityLog/activityLogService.js'
import * as buildingService from '../buildings/buildingService.js'
import { ACTIONS } from '../users/permissions.js'
import * as usersService from '../users/usersService.js'
import * as assessmentService from './assessmentService.js'

export const assessmentRoutes = [
  {
    method: 'PATCH',
    pattern: /^\/reports\/([^/]+)\/assessment$/,
    async handle([id], req) {
      const building = buildingService.getRawBuilding(id)
      if (!building) return { status: 404, body: { error: 'Report not found' } }
      const auth = usersService.authorize(
        req,
        ACTIONS.UPDATE_ASSESSMENT,
        building.settlementId,
      )
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } }
      const body = await readJsonBody(req)
      const result = assessmentService.saveAssessment(id, body)
      if (!result.ok) return { status: 400, body: { error: result.error } }
      activityLogService.record({
        user: auth.user,
        action: 'עדכון שמאות',
        entityType: 'ASSESSMENT',
        entityId: id,
      })
      return { status: 200, body: buildingService.getBuilding(id) }
    },
  },
]
