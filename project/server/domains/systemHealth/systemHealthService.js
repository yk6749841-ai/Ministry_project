// System Health domain — read-only. Computes a management snapshot from data
// other domains already collect; changes nothing.
import { listNotifications } from '../buildings/mockNotificationServer.js'
import * as settlementProcessService from '../settlementProcesses/settlementProcessService.js'

export function getSnapshot() {
  const processes = settlementProcessService.list()
  const completed = processes.filter((p) => p.status === 'COMPLETED')
  const processing = processes.filter((p) => p.status === 'PROCESSING')

  const durationsMs = completed
    .filter((p) => p.completedAt)
    .map((p) => new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime())
  const averageSettlementDurationMs = durationsMs.length
    ? Math.round(durationsMs.reduce((sum, ms) => sum + ms, 0) / durationsMs.length)
    : 0

  const notifications = listNotifications()
  const successful = notifications.filter((n) => n.status === 'SENT').length
  const failed = notifications.filter((n) => n.status === 'FAILED').length
  // One record per attempt; extra attempts per notification = retries.
  const distinctNotifications = new Set(notifications.map((n) => n.idempotencyKey)).size
  const retryCount = Math.max(0, notifications.length - distinctNotifications)

  return {
    settlementProcesses: {
      completed: completed.length,
      processing: processing.length,
    },
    notifications: { successful, failed, retryCount },
    performance: { averageSettlementDurationMs },
  }
}
