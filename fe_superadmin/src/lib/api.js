const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

async function parseResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const rawMessage = payload?.error?.message || payload?.message || 'Request failed'
    const message =
      rawMessage === 'No token provided'
        ? 'Please sign in to access this page.'
        : rawMessage
    throw new Error(message)
  }

  return payload
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  return parseResponse(response)
}

export { API_BASE }
