// Owned by the Settlement Processes domain. Private — only the service touches it.
const processes = []

export const add = (process) => {
  processes.push(process)
}

export const findById = (id) => processes.find((p) => p.id === id)

export const all = () => processes
