// Transport helpers shared by every domain's route table. No business logic here.

export function send(res, status, body, extraHeaders = {}) {
  const isRaw = typeof body === 'string'
  res.writeHead(status, {
    'Content-Type': isRaw ? 'text/plain; charset=utf-8' : 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Settlement-Process-Id',
    ...extraHeaders,
  })
  res.end(body === undefined ? '' : isRaw ? body : JSON.stringify(body))
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) reject(new Error('Request body too large'))
    })
    req.on('end', () => {
      if (!raw.trim()) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Request body is not valid JSON'))
      }
    })
    req.on('error', reject)
  })
}
