// Users domain — public API. Handles login/logout and resolving the acting user
// from a request. No roles, no permissions: any logged-in user may do anything.
import { randomUUID } from 'node:crypto'
import { can, inSettlementScope } from './permissions.js'
import * as store from './userStore.js'

const sessions = new Map() // token -> userId; a login stays valid until logout

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  role: user.role,
  settlementId: user.settlementId ?? null,
})

export function login(username, password) {
  const user = store.findByCredentials(username, password)
  if (!user) return { ok: false }
  const token = randomUUID()
  sessions.set(token, user.id)
  return { ok: true, token, user: publicUser(user) }
}

export function logout(token) {
  sessions.delete(token)
}

export function userForToken(token) {
  const userId = sessions.get(token)
  if (!userId) return null
  const user = store.findById(userId)
  return user ? publicUser(user) : null
}

export function userForRequest(req) {
  return userForToken(req.headers['x-auth-token'])
}

// Server-side permission gate. Call before performing a business action; on
// failure the caller must NOT touch data or write an activity record.
// Pass `buildingSettlementId` to also enforce the caller's area of responsibility.
export function authorize(req, action, buildingSettlementId) {
  const user = userForRequest(req)
  if (!user) return { ok: false, status: 401, error: 'נדרשת התחברות' }
  if (!can(user.role, action)) {
    return {
      ok: false,
      status: 403,
      error: `למשתמש בתפקיד ${user.role} אין הרשאה לבצע פעולה זו`,
    }
  }
  if (buildingSettlementId !== undefined && !inSettlementScope(user, buildingSettlementId)) {
    return { ok: false, status: 403, error: 'המבנה אינו בתחום האחריות שלך' }
  }
  return { ok: true, user }
}

// Read-side scope check (no role/action involved).
export function canView(req, buildingSettlementId) {
  return inSettlementScope(userForRequest(req), buildingSettlementId)
}
