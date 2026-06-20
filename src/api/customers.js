const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'jobapp_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || res.statusText)
  return data
}

export const customersApi = {
  list() {
    return request('/api/customers')
  },
  create(body) {
    return request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  update(id, body) {
    return request(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },
  delete(id) {
    return request(`/api/customers/${id}`, { method: 'DELETE' })
  },
}
