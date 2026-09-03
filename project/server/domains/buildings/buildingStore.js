// Owned by the Buildings domain. Private — only buildingService touches it.
// Holds building core + rehabilitation-process fields; assessment and municipal
// approval data live in their own domains.
import { seedBuildings } from '../../seed.js'

const buildings = seedBuildings.map((b) => ({ ...b }))

export const all = () => buildings

export const findById = (id) => buildings.find((b) => b.id === id)

export const add = (building) => {
  buildings.push(building)
}
