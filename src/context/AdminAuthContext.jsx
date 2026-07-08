import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
} from '../lib/auth-session'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingEmail, setPendingEmail] = useState(null)

  const restoreSession = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get(API_ENDPOINTS.AUTH.ME, { _skipProactiveRefresh: false })
      if (!data?.is_admin) {
        clearAuthSession()
        setUser(null)
        return
      }
      await api.get(API_ENDPOINTS.ADMIN.STATS)
      setUser(data)
    } catch {
      clearAuthSession()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setPendingEmail(null)
    }
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const initiateLogin = useCallback(async (email, password) => {
    const { data } = await api.post(API_ENDPOINTS.ADMIN_AUTH.LOGIN, { email, password })
    setPendingEmail(email.trim().toLowerCase())
    return data
  }, [])

  const verifyOtp = useCallback(async (otp) => {
    if (!pendingEmail) throw new Error('No pending login')
    const { data } = await api.post(API_ENDPOINTS.ADMIN_AUTH.VERIFY_OTP, {
      email: pendingEmail,
      otp,
    })
    const { token, refresh_token, expires_in, user: userData } = data
    if (!userData?.is_admin) {
      clearAuthSession()
      throw new Error('Admin access required')
    }
    saveAuthSession({ token, refresh_token, expires_in })
    await api.get(API_ENDPOINTS.ADMIN.STATS)
    setUser(userData)
    setPendingEmail(null)
    return userData
  }, [pendingEmail])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT, refresh ? { refresh_token: refresh } : {})
    } catch {
      /* ignore */
    }
    clearAuthSession()
    setUser(null)
    setPendingEmail(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      pendingEmail,
      initiateLogin,
      verifyOtp,
      logout,
      cancelPendingLogin: () => setPendingEmail(null),
    }),
    [user, loading, pendingEmail, initiateLogin, verifyOtp, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}

export function getAuthErrorMessage(err) {
  return getApiErrorDetail(err)
}
