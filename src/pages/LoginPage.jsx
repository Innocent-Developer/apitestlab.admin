import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import { useAdminAuth, getAuthErrorMessage } from '../context/AdminAuthContext'

export default function LoginPage() {
  const { isAuthenticated, loading, pendingEmail, initiateLogin, verifyOtp, cancelPendingLogin } =
    useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  if (!loading && isAuthenticated) return <Navigate to="/" replace />

  const handleCredentials = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await initiateLogin(email, password)
      setOtpSent(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleOtp = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await verifyOtp(otp)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pulse/10">
            <Shield className="h-6 w-6 text-pulse" />
          </div>
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted">Secure admin access with OTP verification</p>
        </div>

        {!otpSent && !pendingEmail ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm text-primary outline-none focus:border-pulse/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm text-primary outline-none focus:border-pulse/50"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-info py-2.5 text-sm font-medium text-white hover:bg-info/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="space-y-4">
            <p className="text-sm text-muted">
              Enter the 6-digit code sent to <strong className="text-primary">{pendingEmail}</strong>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-border bg-void px-3 py-3 text-center text-2xl tracking-[0.5em] text-primary outline-none focus:border-pulse/50"
              placeholder="000000"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pulse py-2.5 text-sm font-medium text-void hover:bg-pulse/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify &amp; Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                cancelPendingLogin()
                setOtpSent(false)
                setOtp('')
                setError('')
              }}
              className="w-full text-sm text-muted hover:text-primary"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
