// HTTP bootstrap. Each business domain owns its data and logic and exposes a
// route table; this file only wires them onto a plain node:http server.
import http from 'node:http'
import { send } from './shared/http.js'
import { usersRoutes } from './domains/users/usersRoutes.js'
import { buildingRoutes } from './domains/buildings/buildingRoutes.js'
import { assessmentRoutes } from './domains/assessments/assessmentRoutes.js'
import { municipalApprovalRoutes } from './domains/municipalApprovals/municipalApprovalRoutes.js'
import { activityLogRoutes } from './domains/activityLog/activityLogRoutes.js'
import { settlementProcessRoutes } from './domains/settlementProcesses/settlementProcessRoutes.js'
import { systemHealthRoutes } from './domains/systemHealth/systemHealthRoutes.js'

const PORT = Number(process.env.PORT) || 4000

const routes = [
  ...usersRoutes,
  ...buildingRoutes,
  ...assessmentRoutes,
  ...municipalApprovalRoutes,
  ...activityLogRoutes,
  ...settlementProcessRoutes,
  ...systemHealthRoutes,
]

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname.replace(/\/+$/, '') || '/'

  if (req.method === 'OPTIONS') return send(res, 204)

  const route = routes.find((r) => r.method === req.method && r.pattern.test(path))
  if (!route) {
    return send(res, 404, { error: `No route for ${req.method} ${path}` })
  }

  try {
    const params = path.match(route.pattern).slice(1)
    const { status, body, headers } = await route.handle(params, req)
    send(res, status, body, headers)
  } catch (err) {
    send(res, 400, err.message || 'Bad request')
  }
})

server.listen(PORT, () => {
  console.log(`Damage Reports API listening on http://localhost:${PORT}`)
})
