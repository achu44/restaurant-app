// Thin wrapper around fetch for the Flask API. Always resolves to parsed JSON or throws ApiError.
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'network_error', fields = {} } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const NETWORK_MESSAGE =
  'We couldn’t reach the reservation system. Check your connection and try again, or call (202) 555-4567.'

async function request(path, { method = 'GET', body, timeout = 10000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(NETWORK_MESSAGE)
  } finally {
    clearTimeout(timer)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // non-JSON (e.g. proxy error page)
  }
  if (!response.ok) {
    throw new ApiError(data?.message || NETWORK_MESSAGE, {
      status: response.status,
      code: data?.error || 'server_error',
      fields: data?.fields || {},
    })
  }
  return data
}

export const api = {
  availability: (date) => request(`/availability?date=${encodeURIComponent(date)}`),
  reserve: (payload) => request('/reservations', { method: 'POST', body: payload }),
  subscribe: (payload) => request('/newsletter', { method: 'POST', body: payload }),
}
