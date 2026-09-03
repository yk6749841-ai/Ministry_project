// Settlement Processes domain — HTTP surface. Also emits the settlement-level
// log lines for the "return-home packages for a settlement" flow, each tagged
// with the process id so a whole run can be traced.
import { readJsonBody } from '../../shared/http.js'
import { runWithProcessId } from '../../shared/logContext.js'
import { logger } from '../../shared/logger.js'
import * as usersService from '../users/usersService.js'
import * as settlementProcessService from './settlementProcessService.js'

export const settlementProcessRoutes = [
  {
    method: 'GET',
    pattern: /^\/settlement-processes$/,
    handle() {
      return { status: 200, body: settlementProcessService.list() }
    },
  },
  {
    method: 'POST',
    pattern: /^\/settlement-processes$/,
    async handle(_params, req) {
      const body = await readJsonBody(req)
      const user = usersService.userForRequest(req)
      const settlementName = String(body.settlementName ?? '').trim() || 'כל היישובים'
      const process = settlementProcessService.start({
        settlementName,
        startedBy: user?.fullName ?? 'לא ידוע',
      })

      runWithProcessId(process.id, () => {
        logger.info('SETTLEMENT_PROCESS_STARTED', { settlementName })
        const eligibleCount = Number(body.eligibleCount)
        if (Number.isFinite(eligibleCount)) {
          logger.info('SETTLEMENT_ELIGIBLE_BUILDINGS_FOUND', {
            settlementName,
            buildingCount: eligibleCount,
          })
        }
      })

      return { status: 201, body: process }
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/settlement-processes\/([^/]+)\/complete$/,
    handle([id]) {
      const result = settlementProcessService.complete(id)
      if (!result.ok) {
        return { status: 404, body: { error: 'Settlement process not found' } }
      }
      runWithProcessId(id, () =>
        logger.info('SETTLEMENT_PROCESS_COMPLETED', {
          settlementName: result.process.settlementName,
        }),
      )
      return { status: 200, body: result.process }
    },
  },
  {
    // Client reports an unhandled failure of the whole settlement run.
    method: 'POST',
    pattern: /^\/settlement-processes\/([^/]+)\/log$/,
    async handle([id], req) {
      const body = await readJsonBody(req)
      runWithProcessId(id, () =>
        logger.error('SETTLEMENT_PROCESS_FAILED', {
          settlementName: String(body.settlementName ?? '').trim() || undefined,
          errorMessage: String(body.errorMessage ?? '').slice(0, 500) || undefined,
        }),
      )
      return { status: 200, body: { ok: true } }
    },
  },
]
