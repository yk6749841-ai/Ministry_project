// Settlement Processes domain — public API. Manages one record per run of the
// "generate return-home packages for a settlement" action. A record only, no
// technical detail.
import { randomUUID } from 'node:crypto'
import * as store from './settlementProcessStore.js'

export function start({ settlementName, startedBy }) {
  const process = {
    id: randomUUID(),
    settlementName,
    startedBy,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: 'PROCESSING',
  }
  store.add(process)
  return process
}

export function complete(id) {
  const process = store.findById(id)
  if (!process) return { ok: false }
  process.completedAt = new Date().toISOString()
  process.status = 'COMPLETED'
  return { ok: true, process }
}

export function list() {
  return [...store.all()].reverse() // newest first
}
