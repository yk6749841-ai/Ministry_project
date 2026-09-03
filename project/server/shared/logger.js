// Plain-Node file logger for the "return-home packages for a settlement" flow.
// No dependencies (matching the rest of the server). One JSON object per line so
// the file is both human-readable and easy to parse. Writes are serialised in
// call order and can never throw into the caller.
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { currentProcessId } from './logContext.js'
import { GENERATED_DIR } from './paths.js'

const LOG_PATH = path.join(GENERATED_DIR, 'settlement-process.log')

let queue = mkdir(GENERATED_DIR, { recursive: true }).catch(() => {})

function write(level, event, fields = {}) {
  const record = { timestamp: new Date().toISOString(), level, event }
  // The settlement run this line belongs to, if we're inside one.
  const settlementProcessId = currentProcessId()
  if (settlementProcessId) record.settlementProcessId = settlementProcessId
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') record[key] = value
  }
  const line = `${JSON.stringify(record)}\n`
  queue = queue.then(() => appendFile(LOG_PATH, line, 'utf8')).catch(() => {})
  return queue
}

export const logger = {
  info: (event, fields) => write('INFO', event, fields),
  warn: (event, fields) => write('WARN', event, fields),
  error: (event, fields) => write('ERROR', event, fields),
}
