// Buildings domain — public API. Owns building core data, the rehabilitation
// process, and the national-dashboard readiness calculation.
//
// Assessment and municipal-approval data belong to other domains; this service
// obtains them only through their public APIs (getAssessment / getApproval) and
// merges them into the response so the wire format other consumers expect stays
// unchanged.
import { randomUUID } from 'node:crypto'
import { toBool, toInt, trimStr } from '../../shared/coerce.js'
import { getAssessment } from '../assessments/assessmentService.js'
import { getApproval } from '../municipalApprovals/municipalApprovalService.js'
import * as store from './buildingStore.js'
import {
  INITIAL_STATUS,
  STATUSES,
  canOpenBudgetRequest,
  localityOf,
  nextStatus,
} from './buildingRules.js'
import { readyForLocalityOpening } from './localityReadiness.js'

const REQUIRED_FIELDS = ['reporterName', 'address', 'damageType', 'description']

// Merge in data owned by other domains, obtained through their APIs.
function compose(building) {
  const assessment = getAssessment(building.id)
  const authorityApproval = getApproval(building.id)
  return {
    ...building,
    assessment,
    authorityApproval,
    readyForLocalityOpening: readyForLocalityOpening(building, assessment, authorityApproval),
  }
}

export function exists(id) {
  return Boolean(store.findById(id))
}

export function getBuilding(id) {
  const building = store.findById(id)
  return building ? compose(building) : null
}

// Raw record (no cross-domain merge) — for internal rehab-process checks only.
export function getRawBuilding(id) {
  return store.findById(id)
}

export function listBuildings() {
  return store
    .all()
    .map(compose)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createBuilding(input) {
  const missing = REQUIRED_FIELDS.filter((field) => !trimStr(input[field]))
  if (missing.length) {
    return { ok: false, status: 400, error: `Missing required fields: ${missing.join(', ')}` }
  }
  const building = {
    id: randomUUID(),
    reporterName: trimStr(input.reporterName),
    address: trimStr(input.address),
    settlementId: trimStr(input.settlementId) || localityOf(input.address),
    damageType: trimStr(input.damageType),
    description: trimStr(input.description),
    status: INITIAL_STATUS,
    createdAt: new Date().toISOString(),
    hasDamagePhotos: toBool(input.hasDamagePhotos),
    hasEngineerReport: toBool(input.hasEngineerReport),
    eligibilityChecked: toBool(input.eligibilityChecked),
    apartmentsInBuilding: toInt(input.apartmentsInBuilding),
    socialApproval: toBool(input.socialApproval),
    budgetRequestOpened: toBool(input.budgetRequestOpened),
    familyEmail: trimStr(input.familyEmail),
    returnHomePackageGeneratedAt: null,
  }
  store.add(building)
  return { ok: true, building: compose(building) }
}

export function changeStatus(id, status) {
  const building = store.findById(id)
  if (!building) return { ok: false, status: 404, error: 'Report not found' }
  if (!STATUSES.includes(status)) {
    return { ok: false, status: 400, error: `status must be one of: ${STATUSES.join(', ')}` }
  }
  const allowed = nextStatus(building.status)
  if (status !== building.status && status !== allowed) {
    return {
      ok: false,
      status: 409,
      error: allowed
        ? `Invalid transition: ${building.status} can only move to ${allowed}`
        : `Invalid transition: ${building.status} is the final status`,
    }
  }
  building.status = status
  return { ok: true, building: compose(building) }
}

export function openBudgetRequest(id) {
  const building = store.findById(id)
  if (!building) return { ok: false, status: 404, error: 'Report not found' }
  if (building.budgetRequestOpened) {
    return { ok: true, opened: false, building: compose(building) }
  }
  if (!canOpenBudgetRequest(building)) {
    return { ok: false, status: 409, error: 'Budget request conditions are not met' }
  }
  building.budgetRequestOpened = true
  return { ok: true, opened: true, building: compose(building) }
}

export function markReturnHomePackageGenerated(id) {
  const building = store.findById(id)
  if (building) building.returnHomePackageGeneratedAt = new Date().toISOString()
}
