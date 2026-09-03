// Small input-coercion helpers shared across domains.

export const toBool = (value) =>
  value === true || value === 'true' || value === 1 || value === '1'

export const toInt = (value) => {
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const trimStr = (value) => String(value ?? '').trim()
