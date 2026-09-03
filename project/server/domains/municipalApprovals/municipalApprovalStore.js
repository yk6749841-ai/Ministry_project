// Owned by the Municipal Approvals domain. Private — only the service touches it.
import { seedApprovals } from '../../seed.js'

const approvals = new Map(seedApprovals) // buildingId -> approval

export const get = (buildingId) => approvals.get(buildingId) ?? null

export const set = (buildingId, approval) => {
  approvals.set(buildingId, approval)
}
