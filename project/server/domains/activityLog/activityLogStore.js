// Owned by the Activity Log domain. Private — only activityLogService touches it.
const records = []

export const add = (record) => {
  records.push(record)
}

// Newest first.
export const listByEntityId = (entityId) =>
  records.filter((r) => r.entityId === entityId).slice().reverse()
