// Users domain — client API. A login persists (token in localStorage) until logout.
import { request } from '../../shared/apiClient'

const setToken = (token) => {
  try {
    localStorage.setItem('authToken', token)
  } catch {
    /* storage unavailable — session just won't survive a refresh */
  }
}

const clearToken = () => {
  try {
    localStorage.removeItem('authToken')
  } catch {
    /* ignore */
  }
}

const hasToken = () => {
  try {
    return Boolean(localStorage.getItem('authToken'))
  } catch {
    return false
  }
}

export async function login(username, password) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setToken(data.token)
  return data.user
}

export async function logout() {
  try {
    await request('/logout', { method: 'POST' })
  } catch {
    /* log out locally regardless */
  }
  clearToken()
}

// Returns { user } if still logged in, otherwise null.
export async function getSession() {
  if (!hasToken()) return null
  try {
    const data = await request('/session')
    return { user: data.user }
  } catch {
    clearToken()
    return null
  }
}
