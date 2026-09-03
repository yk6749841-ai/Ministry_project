const BASE_URL = '/api'

function authToken() {
  try {
    return localStorage.getItem('authToken')
  } catch {
    return null
  }
}

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = authToken()
  if (token) headers['X-Auth-Token'] = token

  const res = await fetch(BASE_URL + path, { ...options, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}
