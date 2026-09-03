// System Health domain — HTTP surface.
import * as systemHealthService from './systemHealthService.js'

export const systemHealthRoutes = [
  {
    method: 'GET',
    pattern: /^\/system-health$/,
    handle() {
      return { status: 200, body: systemHealthService.getSnapshot() }
    },
  },
]
