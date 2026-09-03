// Fixture data for a fresh (in-memory) system. Produces one slice per domain;
// each domain's store imports only its own slice.
import { randomUUID } from 'node:crypto'

const iso = (minutesAgo) => new Date(Date.now() - 1000 * 60 * minutesAgo).toISOString()

// Pre-made users (no signup). role ∈ MINISTRY | MUNICIPALITY | APPRAISER.
// MUNICIPALITY users are scoped to a settlement; the others work on all buildings.
export const seedUsers = [
  { id: randomUUID(), fullName: 'שרה לוי', username: 'sara', password: 'sara123', role: 'MINISTRY', settlementId: null },
  { id: randomUUID(), fullName: 'דוד כהן', username: 'david', password: 'david123', role: 'MUNICIPALITY', settlementId: 'ירושלים' },
  { id: randomUUID(), fullName: 'נועה ברק', username: 'noa', password: 'noa123', role: 'MUNICIPALITY', settlementId: 'תל אביב' },
  { id: randomUUID(), fullName: 'מיכל אברהם', username: 'michal', password: 'michal123', role: 'APPRAISER', settlementId: null },
]

/** @type {Array<object>} building core records — no assessment / approval fields */
export const seedBuildings = []
/** @type {Map<string, object>} buildingId -> assessment */
export const seedAssessments = new Map()
/** @type {Map<string, object>} buildingId -> municipal approval */
export const seedApprovals = new Map()

const named = [
  {
    reporterName: 'Dana Cohen',
    settlementId: 'תל אביב',
    address: '12 Herzl St, Tel Aviv',
    damageType: 'Structural crack',
    description: 'Diagonal crack along the stairwell wall between the 2nd and 3rd floors.',
    status: 'WAITING_FOR_VALIDATION',
    createdAt: iso(60 * 26),
    hasDamagePhotos: true,
    hasEngineerReport: false,
    eligibilityChecked: false,
    apartmentsInBuilding: 12,
    socialApproval: false,
    budgetRequestOpened: false,
    familyEmail: 'dana.cohen@example.com',
    returnHomePackageGeneratedAt: null,
  },
  {
    reporterName: 'Rania Haddad',
    settlementId: 'באר שבע',
    address: '9 Ben Gurion St, Beersheba',
    damageType: 'Electrical hazard',
    description: 'Exposed wiring in the shared corridor near the entrance.',
    status: 'REHAB_DONE',
    createdAt: iso(60 * 5),
    hasDamagePhotos: true,
    hasEngineerReport: true,
    eligibilityChecked: true,
    apartmentsInBuilding: 8,
    socialApproval: false,
    budgetRequestOpened: true,
    familyEmail: 'rania.haddad@example.com',
    returnHomePackageGeneratedAt: null,
  },
  {
    reporterName: 'Yossi Levi',
    settlementId: 'חיפה',
    address: '4 Weizmann Blvd, Haifa',
    damageType: 'Water damage',
    description: 'Ceiling leak in the lobby after heavy rain; plaster is coming loose.',
    status: 'IN_REVIEW',
    createdAt: iso(90),
    hasDamagePhotos: true,
    hasEngineerReport: true,
    eligibilityChecked: false,
    apartmentsInBuilding: 24,
    socialApproval: false,
    budgetRequestOpened: false,
    familyEmail: 'yossi.levi@example.com',
    returnHomePackageGeneratedAt: null,
  },
  {
    reporterName: 'Miriam Azoulay',
    settlementId: 'ירושלים',
    address: '21 Jaffa Rd, Jerusalem',
    damageType: 'Foundation settlement',
    description: 'Uneven floors and widening gaps around door frames across several units.',
    status: 'NEW',
    createdAt: iso(60 * 12),
    hasDamagePhotos: true,
    hasEngineerReport: true,
    eligibilityChecked: true,
    apartmentsInBuilding: 30,
    socialApproval: false,
    budgetRequestOpened: false,
    familyEmail: 'miriam.azoulay@example.com',
    returnHomePackageGeneratedAt: null,
  },
]

for (const record of named) {
  seedBuildings.push({ id: randomUUID(), ...record })
}

// 20 buildings in ירושלים — first 10 eligible for a return-home package; the
// national-platform data is varied so the locality summary shows every category.
const JERUSALEM_STREETS = [
  'רחוב יפו',
  'שדרות הרצל',
  'רחוב אגריפס',
  'רחוב בן יהודה',
  'רחוב עמק רפאים',
  'שדרות בן גוריון',
  "רחוב קינג ג'ורג'",
  'רחוב שטראוס',
  'רחוב הנביאים',
  'רחוב עזה',
]

for (let i = 0; i < 20; i += 1) {
  const eligible = i < 10
  const withPackage = eligible && i < 8
  const withAssessment = eligible && i < 8
  const withAuthority = eligible && [0, 1, 2, 5, 6, 7].includes(i)
  const damageGrade = i === 7 ? 'חמור' : i % 2 === 0 ? 'קל' : 'בינוני'
  const id = randomUUID()

  seedBuildings.push({
    id,
    reporterName: `ועד בית ${i + 1}`,
    settlementId: 'ירושלים',
    address: `${JERUSALEM_STREETS[i % JERUSALEM_STREETS.length]} ${11 + i}, ירושלים`,
    damageType: eligible ? 'נזקי רעידת אדמה' : 'נזקי מים',
    description: 'מבנה לדוגמה עבור בדיקת הפקה מרוכזת של תיקי חזרה לבית.',
    status: eligible ? 'REHAB_DONE' : 'IN_REVIEW',
    createdAt: iso(i + 1),
    hasDamagePhotos: true,
    hasEngineerReport: true,
    eligibilityChecked: true,
    apartmentsInBuilding: 8 + (i % 5) * 4,
    socialApproval: true,
    budgetRequestOpened: eligible,
    familyEmail: `mishpaha${i + 1}@example.co.il`,
    returnHomePackageGeneratedAt: withPackage ? iso(30) : null,
  })

  if (withAssessment) {
    seedAssessments.set(id, {
      damageGrade,
      notes: 'הערכת שמאי לדוגמה.',
      inspectionDate: '2026-09-01',
      reinspectionRequired: false,
      savedAt: iso(40),
    })
  }
  if (withAuthority) {
    seedApprovals.set(id, {
      waterOk: true,
      electricityOk: true,
      accessRoadsOpen: true,
      hazardsCleared: true,
      notes: '',
      approved: true,
      savedAt: iso(20),
    })
  }
}
