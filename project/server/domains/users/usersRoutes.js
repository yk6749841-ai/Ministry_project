// Users domain — HTTP surface. POST /login, POST /logout, GET /session.
import { readJsonBody } from '../../shared/http.js'
import * as usersService from './usersService.js'

export const usersRoutes = [
  {
    method: 'POST',
    pattern: /^\/login$/,
    async handle(_params, req) {
      const body = await readJsonBody(req)
      const result = usersService.login(
        String(body.username ?? ''),
        String(body.password ?? ''),
      )
      if (!result.ok) {
        return { status: 401, body: { error: 'שם משתמש או סיסמה שגויים' } }
      }
      return { status: 200, body: { token: result.token, user: result.user } }
    },
  },
  {
    method: 'POST',
    pattern: /^\/logout$/,
    handle(_params, req) {
      usersService.logout(req.headers['x-auth-token'])
      return { status: 200, body: { ok: true } }
    },
  },
  {
    method: 'GET',
    pattern: /^\/session$/,
    handle(_params, req) {
      const user = usersService.userForRequest(req)
      return user
        ? { status: 200, body: { user } }
        : { status: 401, body: { error: 'Not authenticated' } }
    },
  },
]
