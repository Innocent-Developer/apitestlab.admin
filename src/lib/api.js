import axios from 'axios'
import { API_ENDPOINTS } from './constants'
import {
  clearAuthSession,
  dispatchSessionExpired,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  saveAuthSession,
} from './auth-session'

export function getApiErrorDetail(error) {
  if (!error) return 'Unknown error'
  const res = error.response
  if (!res) return error.message || 'Network error'
  const d = res.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    return d.map((x) => (x?.msg ? x.msg : JSON.stringify(x))).join('; ') || 'Validation error'
  }
  if (d && typeof d === 'object') {
    if (typeof d.message === 'string') return d.message
    return JSON.stringify(d)
  }
  return res.statusText || error.message || `Request failed (${res.status})`
}

function resolveBaseURL() {
  const fromEnv = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'development') return ''
  return ''
}

export const baseURL = resolveBaseURL()

const api = axios.create({
  baseURL: baseURL || undefined,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL || ''}${API_ENDPOINTS.AUTH.REFRESH}`, { refresh_token: refreshToken })
      .then((res) => {
        const { token, refresh_token, expires_in } = res.data || {}
        if (!token) throw new Error('Refresh response missing token')
        saveAuthSession({ token, refresh_token, expires_in })
        return token
      })
      .catch((err) => {
        clearAuthSession()
        dispatchSessionExpired()
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function isRefreshRequest(config) {
  return String(config?.url || '').includes('/auth/refresh')
}

api.interceptors.request.use(async (config) => {
  if (!isRefreshRequest(config) && !config._skipProactiveRefresh) {
    if (isAccessTokenExpired() && getRefreshToken()) {
      try {
        await refreshAccessToken()
      } catch {
        return Promise.reject(new Error('Session expired'))
      }
    }
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    if (response.data == null) response.data = {}
    return response
  },
  async (error) => {
    const original = error?.config
    if (
      original &&
      !original._retry &&
      error?.response?.status === 401 &&
      !isRefreshRequest(original) &&
      getRefreshToken()
    ) {
      original._retry = true
      try {
        const token = await refreshAccessToken()
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export default api
