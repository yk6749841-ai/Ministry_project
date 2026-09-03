// Buildings domain — HTTP surface. Covers building CRUD, the rehabilitation
// process (status, budget request, return-home package) and the notification
// server that the package flow uses.
import { readJsonBody } from '../../shared/http.js'
import { runWithProcessId } from '../../shared/logContext.js'
import { logger } from '../../shared/logger.js'
import * as activityLogService from '../activityLog/activityLogService.js'
import { ACTIONS, inSettlementScope } from '../users/permissions.js'
import * as usersService from '../users/usersService.js'
import * as buildingService from './buildingService.js'
import {
  canGenerateReturnHomePackage,
  generateReturnHomePackage,
  readGeneratedFile,
} from './occupancyPackageService.js'
import { getMode, listNotifications, setMode } from './mockNotificationServer.js'
import { sendNotificationWithRetry } from './notificationClient.js'

export const buildingRoutes = [
  {
    method: 'GET',
    pattern: /^\/reports$/,
    handle(_params, req) {
      const user = usersService.userForRequest(req)
      // A MUNICIPALITY user only ever sees buildings in their own settlement.
      const buildings = buildingService
        .listBuildings()
        .filter((b) => inSettlementScope(user, b.settlementId))
      return { status: 200, body: buildings }
    },
  },
  {
    method: 'POST',
    pattern: /^\/reports$/,
    async handle(_params, req) {
      const body = await readJsonBody(req)
      const result = buildingService.createBuilding(body)
      if (!result.ok) return { status: result.status, body: { error: result.error } }
      return { status: 201, body: result.building }
    },
  },
  {
    method: 'GET',
    pattern: /^\/reports\/([^/]+)$/,
    handle([id], req) {
      const building = buildingService.getBuilding(id)
      if (!building) return { status: 404, body: { error: 'Report not found' } }
      if (!inSettlementScope(usersService.userForRequest(req), building.settlementId)) {
        return { status: 403, body: { error: 'המבנה אינו בתחום האחריות שלך' } }
      }
      return { status: 200, body: building }
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/reports\/([^/]+)\/status$/,
    async handle([id], req) {
      const body = await readJsonBody(req)
      const result = buildingService.changeStatus(id, body.status)
      if (!result.ok) return { status: result.status, body: { error: result.error } }
      return { status: 200, body: result.building }
    },
  },
  {
    method: 'POST',
    pattern: /^\/reports\/([^/]+)\/budget-request$/,
    handle([id], req) {
      const building = buildingService.getRawBuilding(id)
      if (!building) return { status: 404, body: { error: 'Report not found' } }
      const auth = usersService.authorize(
        req,
        ACTIONS.OPEN_BUDGET_REQUEST,
        building.settlementId,
      )
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } }
      const result = buildingService.openBudgetRequest(id)
      if (!result.ok) return { status: result.status, body: { error: result.error } }
      if (result.opened) {
        activityLogService.record({
          user: auth.user,
          action: 'פתיחת בקשת תקציב',
          entityType: 'BUDGET_REQUEST',
          entityId: id,
        })
      }
      return { status: 200, body: result.building }
    },
  },
  {
    method: 'POST',
    pattern: /^\/buildings\/([^/]+)\/return-home-package$/,
    async handle([id], req) {
      const building = buildingService.getRawBuilding(id)
      if (!building) return { status: 404, body: { error: 'Building not found' } }
      if (!canGenerateReturnHomePackage(building)) {
        return { status: 409, body: { error: 'Return-home package conditions are not met' } }
      }
      // Tag every log line from this generation with the settlement run it
      // belongs to (sent by the caller). Absent for one-off single-building runs.
      const processIdHeader = req.headers['x-settlement-process-id']
      const settlementProcessId =
        processIdHeader && processIdHeader !== 'undefined' ? processIdHeader : undefined
      return runWithProcessId(settlementProcessId, async () => {
        const ctx = { settlementName: building.settlementId, buildingId: id }
        logger.info('BUILDING_HANDLING_STARTED', ctx)
        const result = await generateReturnHomePackage(building)
        buildingService.markReturnHomePackageGenerated(id)
        logger.info('BUILDING_HANDLING_COMPLETED', ctx)
        return { status: 201, body: result }
      })
    },
  },
  {
    method: 'GET',
    pattern: /^\/files\/([^/]+)$/,
    async handle([name], req) {
      const content = await readGeneratedFile(name)
      if (content === null) return { status: 404, body: { error: 'File not found' } }
      const download = new URL(req.url, 'http://localhost').searchParams.has('download')
      return {
        status: 200,
        body: content,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
        },
      }
    },
  },
  {
    // Send a family notification: retries up to 3× (stops at first SENT), every
    // attempt logged as its own record. Returns the final outcome.
    method: 'POST',
    pattern: /^\/notifications\/send$/,
    async handle(_params, req) {
      const body = await readJsonBody(req)
      const missing = ['buildingId', 'email', 'subject', 'body'].filter(
        (f) => !String(body[f] ?? '').trim(),
      )
      if (missing.length) {
        return { status: 400, body: { error: `Missing fields: ${missing.join(', ')}` } }
      }
      const result = await sendNotificationWithRetry({
        buildingId: body.buildingId,
        email: body.email,
        subject: body.subject,
        body: body.body,
        idempotencyKey: body.idempotencyKey,
      })
      return { status: 200, body: result }
    },
  },
  {
    method: 'GET',
    pattern: /^\/notifications\/mode$/,
    handle() {
      return { status: 200, body: { mode: getMode() } }
    },
  },
  {
    method: 'POST',
    pattern: /^\/notifications\/mode$/,
    async handle(_params, req) {
      const body = await readJsonBody(req)
      try {
        return { status: 200, body: { mode: setMode(body.mode) } }
      } catch (err) {
        return { status: 400, body: { error: err.message } }
      }
    },
  },
  {
    method: 'GET',
    pattern: /^\/notifications$/,
    handle() {
      return { status: 200, body: listNotifications() }
    },
  },
]
