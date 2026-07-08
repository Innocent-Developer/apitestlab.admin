const TOKEN_KEY = 'admin_token'
const REFRESH_KEY = 'admin_refresh_token'
const EXPIRES_AT_KEY = 'admin_token_expires_at'

const DEFAULT_ACCESS_TOKEN_LIFETIME_MS = 30 * 60 * 1000

export function saveAuthSession({ token, refresh_token, expires_in }) {
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  if (refresh_token) window.localStorage.setItem(REFRESH_KEY, refresh_token)
  const lifetimeMs =
    expires_in != null && Number.isFinite(Number(expires_in))
      ? Number(expires_in) * 1000
      : DEFAULT_ACCESS_TOKEN_LIFETIME_MS
  window.localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + lifetimeMs))
}

export function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
  window.localStorage.removeItem(EXPIRES_AT_KEY)
}

export function getAccessToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_KEY)
}

export function getTokenExpiresAt() {
  const raw = window.localStorage.getItem(EXPIRES_AT_KEY)
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

export function isAccessTokenExpired(bufferMs = 60_000) {
  const expiresAt = getTokenExpiresAt()
  if (!expiresAt) return true
  return Date.now() >= expiresAt - bufferMs
}

export const AUTH_SESSION_EXPIRED_EVENT = 'admin:session-expired'

export function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT))
}
