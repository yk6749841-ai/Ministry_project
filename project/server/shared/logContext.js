// Ambient per-request context so every log line produced while one settlement
// run is executing carries that run's id — without threading it through the PDF,
// notification or retry code. Concurrent runs each get their own async store.
import { AsyncLocalStorage } from 'node:async_hooks'

const storage = new AsyncLocalStorage()

export const runWithProcessId = (settlementProcessId, fn) =>
  storage.run({ settlementProcessId }, fn)

export const currentProcessId = () => storage.getStore()?.settlementProcessId
