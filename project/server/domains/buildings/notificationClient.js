// Our side's retry policy for talking to the (flaky) Mock Notification Server.
// Kept in its own module so the mock server's structure stays untouched.
import { logger } from '../../shared/logger.js'
import { sendNotification } from './mockNotificationServer.js'

const MAX_ATTEMPTS = 3

// Sends via the notification server up to MAX_ATTEMPTS times, back to back with
// no delay, stopping at the first SENT. The mock server records every attempt as
// its own log entry; this only decides whether to try again, and returns the
// result of the last attempt made. Log lines are observability only — the retry
// logic below is unchanged.
export async function sendNotificationWithRetry(payload) {
  const ctx = { settlementName: payload.settlementId, buildingId: payload.buildingId }
  let result
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 1) {
      logger.info('NOTIFICATION_RETRY_STARTED', { ...ctx, notificationAttempt: attempt })
    }
    result = await sendNotification(payload)
    if (result.status === 'SENT') {
      logger.info('NOTIFICATION_SEND_SUCCEEDED', { ...ctx, notificationAttempt: attempt })
      break
    } else if (result.status === 'ALREADY_SENT') {
      logger.info('NOTIFICATION_SEND_SUCCEEDED', { ...ctx, notificationAttempt: attempt })
    } else {
      logger.warn('NOTIFICATION_ATTEMPT_FAILED', {
        ...ctx,
        notificationAttempt: attempt,
        errorMessage: `notification returned ${result.status}`,
      })
    }
  }
  return result
}
