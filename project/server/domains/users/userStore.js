// Owned by the Users domain. Private — only usersService touches it.
import { seedUsers } from '../../seed.js'

const users = seedUsers.map((u) => ({ ...u }))

export const findByCredentials = (username, password) =>
  users.find((u) => u.username === username && u.password === password) ?? null

export const findById = (id) => users.find((u) => u.id === id) ?? null

export const usernames = () => users.map((u) => u.username)
