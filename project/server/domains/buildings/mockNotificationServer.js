// Mock Notification Server. Stands in for an external messaging system that may
// succeed or fail depending on its current mode. Every call produces exactly one
// log record (SENT or FAILED), writes a CSV row, and never throws. No retries or
// other failure handling live here.
import { randomUUID } from 'node:crypto'
import { access, appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { GENERATED_DIR } from '../../shared/paths.js'

const CSV_PATH = path.join(GENERATED_DIR, 'notifications.csv')
const CSV_HEADER = 'messageId,buildingId,email,subject,date,time,status\n'

export const NOTIFICATION_MODES = [
  'SUCCESS',
  'ALWAYS_FAIL',
  'FAIL_FIRST',
  'RANDOM',
  'RESPONSE_LOST',
]
const RANDOM_FAILURE_RATE = 0.3

// In-memory log that powers the Notification Center screen.
const notifications = []

let mode = 'SUCCESS'

// buildingIds that have already been attempted at least once. Used only by
// FAIL_FIRST. Persists for the lifetime of the server (across mode changes) so
// the *second* attempt for a given building always succeeds — restart the server
// to reset it.
const attemptedBuildings = new Set()

export function getMode() {
  return mode
}

export function setMode(next) {
  if (!NOTIFICATION_MODES.includes(next)) {
    throw new Error(`Unknown notification mode: ${next}`)
  }
  mode = next
  return mode
}

// Decide SENT / FAILED for one attempt, evaluated fresh on every call (i.e. once
// per incoming POST /notifications/send).
function resolveStatus(buildingId) {
  if (mode === 'ALWAYS_FAIL') return 'FAILED'
  if (mode === 'RANDOM') {
    // Independent 30% roll for this single request.
    return Math.random() < RANDOM_FAILURE_RATE ? 'FAILED' : 'SENT'
  }
  if (mode === 'FAIL_FIRST') {
    const firstAttempt = !attemptedBuildings.has(buildingId)
    attemptedBuildings.add(buildingId)
    return firstAttempt ? 'FAILED' : 'SENT'
  }
  return 'SENT' // SUCCESS and RESPONSE_LOST — the message is actually sent
}

const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`

async function appendCsvRow(record, date, time) {
  await mkdir(GENERATED_DIR, { recursive: true })
  try {
    await access(CSV_PATH)
  } catch {
    await appendFile(CSV_PATH, CSV_HEADER, 'utf8')
  }
  const row = `${[
    record.messageId,
    record.buildingId,
    record.email,
    record.subject,
    date,
    time,
    record.status,
  ]
    .map(csvCell)
    .join(',')}\n`
  await appendFile(CSV_PATH, row, 'utf8')
}

export async function sendNotification({ buildingId, email, subject, body, idempotencyKey }) {
  // For the MVP the key is just the buildingId, so every attempt for the same
  // building shares it.
  const key = idempotencyKey ?? buildingId

  // A family is notified once: if a message with this key already went out
  // successfully, don't send or log another — just report it.
  const existing = notifications.find(
    (entry) => entry.idempotencyKey === key && entry.status === 'SENT',
  )
  if (existing) {
    return { status: 'ALREADY_SENT', messageId: existing.messageId }
  }

  const now = new Date()
  const record = {
    messageId: `MSG-${randomUUID().slice(0, 8).toUpperCase()}`,
    idempotencyKey: key,
    buildingId,
    email,
    subject,
    body,
    sentAt: now.toISOString(),
    status: resolveStatus(buildingId),
  }
  notifications.push(record)
  await appendCsvRow(record, now.toISOString().slice(0, 10), now.toISOString().slice(11, 19))

  // RESPONSE_LOST: the message was sent and logged as SENT, but the success
  // reply is lost in transit — report no acknowledgement so the existing retry
  // mechanism tries again (up to 3×).
  if (mode === 'RESPONSE_LOST') {
    return { status: 'NO_RESPONSE', messageId: record.messageId }
  }
  return { status: record.status, messageId: record.messageId }
}

export function listNotifications() {
  // Newest first; drop the long body — the screen doesn't show it.
  return notifications.map(({ body: _body, ...rest }) => rest).reverse()
}
