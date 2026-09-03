// Activity Log domain — public API. Records who did what. Every call creates a
// new record; existing records are never touched.
import { randomUUID } from 'node:crypto'
import * as usersService from '../users/usersService.js'
import * as store from './activityLogStore.js'

export function record({ user, action, entityType, entityId }) {
  store.add({
    id: randomUUID(),
    userId: user?.id ?? null,
    userName: user?.fullName ?? 'לא ידוע',
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
  })
}

// Resolve the acting user from the request (via the Users API) and record.
export function recordFromRequest(req, entry) {
  record({ user: usersService.userForRequest(req), ...entry })
}

export function listForBuilding(buildingId) {
  return store.listByEntityId(buildingId)
}
