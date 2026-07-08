import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import Modal from '../ui/Modal'
import api, { getApiErrorDetail } from '../../lib/api'
import { API_ENDPOINTS } from '../../lib/constants'

export default function SendEmailModal({
  open,
  onClose,
  onSent,
  initialUser = null,
  filterDefaults = {},
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [bodyType, setBodyType] = useState('plain')
  const [target, setTarget] = useState(initialUser ? 'selected' : 'filtered')
  const [onlyActive, setOnlyActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        subject,
        body,
        body_type: bodyType,
        target,
        only_active: onlyActive,
      }
      if (target === 'selected' && initialUser) {
        payload.user_ids = [initialUser._id]
      }
      if (target === 'filtered') {
        if (filterDefaults.q) payload.q = filterDefaults.q
        if (filterDefaults.plan) payload.plan = filterDefaults.plan
        if (filterDefaults.is_active !== undefined && filterDefaults.is_active !== '') {
          payload.is_active = filterDefaults.is_active === 'true' || filterDefaults.is_active === true
        }
      }
      if (target === 'all' && filterDefaults.plan) {
        payload.plan = filterDefaults.plan
      }
      const { data } = await api.post(API_ENDPOINTS.ADMIN.SEND_EMAIL, payload)
      onSent?.(data.message || 'Email queued')
      onClose()
      setSubject('')
      setBody('')
    } catch (err) {
      setError(getApiErrorDetail(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send email" wide>
      <form onSubmit={handleSend} className="space-y-4">
        {initialUser && (
          <p className="rounded-lg border border-border bg-void px-3 py-2 text-sm text-muted">
            To: <span className="text-primary">{initialUser.email}</span>
          </p>
        )}

        {!initialUser && (
          <div>
            <label className="mb-1 block text-xs text-muted">Recipients</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
            >
              <option value="filtered">Current filter (search/plan/status)</option>
              <option value="all">All users</option>
            </select>
            {target === 'all' && (
              <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                />
                Active users only
              </label>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-muted">Subject</label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
            placeholder="Email subject"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs text-muted">Body</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="rounded border border-border bg-void px-2 py-0.5 text-xs"
            >
              <option value="plain">Plain text</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <textarea
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-border bg-void px-3 py-2 font-mono text-sm"
            placeholder={bodyType === 'html' ? '<p>Hello {{name}}</p>' : 'Write your message…'}
          />
          <p className="mt-1 text-[10px] text-muted">
            {bodyType === 'html'
              ? 'HTML is sent as-is in the email body.'
              : 'Plain text is wrapped in a simple HTML template for delivery.'}
          </p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send email
          </button>
        </div>
      </form>
    </Modal>
  )
}
