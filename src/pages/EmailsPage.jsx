import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Mail, Search, Sparkles, AtSign, Users, Inbox, Send, RefreshCw, Eye } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import { useToast } from '../components/ui/Toast'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

const PAGE_SIZE = 20

const EMAIL_STYLES = [
  { value: 'professional', label: 'Professional', hint: 'Polished business email' },
  { value: 'complete', label: 'Complete', hint: 'Full email with sections + CTA + signature' },
  { value: 'formal', label: 'Formal', hint: 'Official corporate notice' },
  { value: 'friendly', label: 'Friendly', hint: 'Warm and approachable' },
  { value: 'marketing', label: 'Marketing', hint: 'Promotional with clear CTA' },
  { value: 'announcement', label: 'Announcement', hint: 'Product or platform update' },
  { value: 'newsletter', label: 'Newsletter', hint: 'Scannable sections and bullets' },
  { value: 'support', label: 'Support', hint: 'Empathetic help-desk tone' },
  { value: 'urgent', label: 'Urgent', hint: 'Direct and time-sensitive' },
  { value: 'short', label: 'Short', hint: 'Brief 2–4 sentences' },
]

const EMAIL_LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'complete', label: 'Complete' },
]

export default function EmailsPage() {
  const { toast } = useToast()

  const [pageView, setPageView] = useState('compose') // compose | sent | received
  const [mode, setMode] = useState('users') // users | custom

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState('')
  const [isActive, setIsActive] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [target, setTarget] = useState('selected')
  const [selectedIds, setSelectedIds] = useState([])
  const [onlyActive, setOnlyActive] = useState(true)
  const [recipientInput, setRecipientInput] = useState('')

  const [aiPrompt, setAiPrompt] = useState('')
  const [emailStyle, setEmailStyle] = useState('professional')
  const [emailLength, setEmailLength] = useState('standard')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [bodyType, setBodyType] = useState('plain')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)

  const [mailRows, setMailRows] = useState([])
  const [mailHasMore, setMailHasMore] = useState(false)
  const [loadingMails, setLoadingMails] = useState(false)
  const [selectedMailId, setSelectedMailId] = useState(null)
  const [mailDetail, setMailDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadUsers = useCallback(async () => {
    if (mode !== 'users' || pageView !== 'compose') return
    setLoadingUsers(true)
    try {
      const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
      if (q.trim()) params.q = q.trim()
      if (plan) params.plan = plan
      if (isActive !== '') params.is_active = isActive === 'true'
      const { data } = await api.get(API_ENDPOINTS.ADMIN.USERS, { params })
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setLoadingUsers(false)
    }
  }, [mode, page, q, plan, isActive, toast, pageView])

  const loadMails = useCallback(async () => {
    if (pageView !== 'sent' && pageView !== 'received') return
    setLoadingMails(true)
    setMailDetail(null)
    setSelectedMailId(null)
    try {
      const endpoint =
        pageView === 'sent' ? API_ENDPOINTS.ADMIN.EMAILS_SENT : API_ENDPOINTS.ADMIN.EMAILS_RECEIVED
      const { data } = await api.get(endpoint, { params: { limit: 40 } })
      setMailRows(Array.isArray(data?.data) ? data.data : [])
      setMailHasMore(!!data?.has_more)
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
      setMailRows([])
    } finally {
      setLoadingMails(false)
    }
  }, [pageView, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadMails()
  }, [loadMails])

  const openMail = async (id) => {
    if (!id) return
    setSelectedMailId(id)
    setLoadingDetail(true)
    setMailDetail(null)
    try {
      const endpoint =
        pageView === 'sent'
          ? API_ENDPOINTS.ADMIN.EMAIL_SENT(id)
          : API_ENDPOINTS.ADMIN.EMAIL_RECEIVED(id)
      const { data } = await api.get(endpoint)
      setMailDetail(data)
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  const formatAddrs = (v) => {
    if (!v) return ''
    if (Array.isArray(v)) return v.join(', ') || ''
    return String(v)
  }

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const visibleSelected = users.length > 0 && users.every((u) => selectedSet.has(u._id))

  const toggleUser = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleVisible = () => {
    if (visibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !users.some((u) => u._id === id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...users.map((u) => u._id)])))
    }
  }

  const parsedRecipients = useMemo(
    () =>
      recipientInput
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [recipientInput],
  )

  const audienceLabel =
    mode === 'custom'
      ? parsedRecipients.length
        ? `${parsedRecipients.length} custom recipient(s)`
        : 'custom recipient (not set)'
      : target === 'all'
        ? onlyActive
          ? 'all active users'
          : 'all users'
        : target === 'filtered'
          ? 'currently filtered users'
          : `${selectedIds.length} selected user(s)`

  const selectedStyle = EMAIL_STYLES.find((s) => s.value === emailStyle)

  const generateDraft = async () => {
    if (!aiPrompt.trim()) {
      toast('Write what the email should say first.', 'error')
      return
    }
    setDrafting(true)
    try {
      const { data } = await api.post(API_ENDPOINTS.ADMIN.EMAIL_DRAFT, {
        prompt: aiPrompt.trim(),
        audience: audienceLabel,
        tone: emailStyle,
        style: emailStyle,
        length: emailLength,
        body_type: bodyType,
      })
      setSubject(data.subject || '')
      setBody(data.body || '')
      setBodyType(data.body_type || bodyType)
      toast(data.source === 'ai' ? 'AI draft generated' : 'Draft generated', 'success')
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setDrafting(false)
    }
  }

  const sendEmail = async (e) => {
    e.preventDefault()
    if (mode === 'custom' && parsedRecipients.length === 0) {
      toast('Add at least one receiver email address.', 'error')
      return
    }
    if (mode === 'users' && target === 'selected' && selectedIds.length === 0) {
      toast('Select at least one user.', 'error')
      return
    }
    setSending(true)
    try {
      const payload = {
        subject,
        body,
        body_type: bodyType,
        target: mode === 'custom' ? 'custom' : target,
        only_active: onlyActive,
      }
      if (mode === 'custom') payload.recipient_emails = parsedRecipients
      if (mode === 'users' && target === 'selected') payload.user_ids = selectedIds
      if (mode === 'users' && target === 'filtered') {
        if (q.trim()) payload.q = q.trim()
        if (plan) payload.plan = plan
        if (isActive !== '') payload.is_active = isActive === 'true'
      }
      if (mode === 'users' && target === 'all' && plan) payload.plan = plan

      const { data } = await api.post(API_ENDPOINTS.ADMIN.SEND_EMAIL, payload)
      toast(data.message || 'Email queued', 'success')
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <AppShell title="Emails">
      <div className="mb-6 rounded-xl border border-border bg-surface/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pulse/10 p-2 text-pulse">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Email center</h2>
              <p className="text-sm text-muted">
                Send with Resend, or browse sent and received mail from your Resend account.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-border p-1">
              <button
                type="button"
                onClick={() => setPageView('compose')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                  pageView === 'compose' ? 'bg-pulse/15 text-pulse' : 'text-muted hover:text-primary'
                }`}
              >
                <Send className="h-4 w-4" />
                Compose
              </button>
              <button
                type="button"
                onClick={() => setPageView('sent')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                  pageView === 'sent' ? 'bg-pulse/15 text-pulse' : 'text-muted hover:text-primary'
                }`}
              >
                <Mail className="h-4 w-4" />
                Sent
              </button>
              <button
                type="button"
                onClick={() => setPageView('received')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                  pageView === 'received' ? 'bg-pulse/15 text-pulse' : 'text-muted hover:text-primary'
                }`}
              >
                <Inbox className="h-4 w-4" />
                Received
              </button>
            </div>
            {pageView === 'compose' && (
              <div className="flex rounded-lg border border-border p-1">
                <button
                  type="button"
                  onClick={() => setMode('users')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                    mode === 'users' ? 'bg-pulse/15 text-pulse' : 'text-muted hover:text-primary'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  To users
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                    mode === 'custom' ? 'bg-pulse/15 text-pulse' : 'text-muted hover:text-primary'
                  }`}
                >
                  <AtSign className="h-4 w-4" />
                  Custom receiver
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(pageView === 'sent' || pageView === 'received') && (
        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-primary">
                {pageView === 'sent' ? 'Sent via Resend' : 'Received via Resend'}
              </h3>
              <button
                type="button"
                onClick={loadMails}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-primary"
              >
                <RefreshCw className={`h-4 w-4 ${loadingMails ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {loadingMails ? (
              <div className="flex items-center gap-2 py-10 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : mailRows.length === 0 ? (
              <p className="py-8 text-sm text-muted">
                {pageView === 'sent'
                  ? 'No sent emails yet. Compose and send to see them here.'
                  : 'No received emails. Inbound requires a Resend receiving domain.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <th className="pb-2 pr-3 font-medium">Subject</th>
                      <th className="pb-2 pr-3 font-medium">From</th>
                      <th className="pb-2 pr-3 font-medium">To</th>
                      <th className="pb-2 pr-3 font-medium">Created</th>
                      <th className="pb-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mailRows.map((row) => (
                      <tr
                        key={row.id}
                        className={selectedMailId === row.id ? 'bg-pulse/5' : ''}
                      >
                        <td className="max-w-[220px] truncate py-3 pr-3 text-primary">
                          {row.subject || '(no subject)'}
                        </td>
                        <td className="max-w-[160px] truncate py-3 pr-3 text-muted">
                          {formatAddrs(row.from)}
                        </td>
                        <td className="max-w-[160px] truncate py-3 pr-3 text-muted">
                          {formatAddrs(row.to)}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString()
                            : ''}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openMail(row.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-primary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mailHasMore ? (
                  <p className="mt-3 text-xs text-muted">More emails available in Resend.</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 font-semibold text-primary">Message</h3>
            {loadingDetail ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !mailDetail ? (
              <p className="text-sm text-muted">Select an email to view details.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Subject</p>
                  <p className="font-medium text-primary">{mailDetail.subject || ''}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">From</p>
                  <p className="text-primary">{formatAddrs(mailDetail.from)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">To</p>
                  <p className="text-primary">{formatAddrs(mailDetail.to)}</p>
                </div>
                {mailDetail.last_event ? (
                  <div>
                    <p className="text-xs text-muted">Last event</p>
                    <Badge>{mailDetail.last_event}</Badge>
                  </div>
                ) : null}
                <div>
                  <p className="mb-1 text-xs text-muted">Body</p>
                  {mailDetail.html ? (
                    <div
                      className="max-h-80 overflow-auto rounded-lg border border-border bg-void p-3 text-xs"
                      dangerouslySetInnerHTML={{ __html: mailDetail.html }}
                    />
                  ) : (
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-void p-3 text-xs text-primary">
                      {mailDetail.text || 'No body returned by Resend for this message.'}
                    </pre>
                  )}
                </div>
                <p className="break-all text-[10px] text-muted">ID: {mailDetail.id}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {pageView === 'compose' && (
      <div className={`grid gap-6 ${mode === 'users' ? 'xl:grid-cols-[1fr_420px]' : ''}`}>
        <form onSubmit={sendEmail} className="space-y-6">
          {mode === 'custom' && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 font-semibold text-primary">Receiver email</h3>
              <p className="mb-3 text-xs text-muted">
                Enter one or more email addresses. Separate multiple addresses with a comma, semicolon, or new line.
              </p>
              <textarea
                rows={3}
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="partner@company.com, support@vendor.com"
                className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
              />
              {parsedRecipients.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {parsedRecipients.map((email) => (
                    <span
                      key={email}
                      className="rounded-full border border-border bg-void px-2.5 py-0.5 text-xs text-primary"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pulse" />
              <h3 className="font-semibold text-primary">AI writer</h3>
            </div>
            <div className="space-y-3">
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={
                  mode === 'custom'
                    ? 'Example: Write a professional email to our partner about the new API integration.'
                    : 'Example: Write a complete professional email announcing Pro plan access and new benefits.'
                }
                className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-muted">Style</label>
                  <select
                    value={emailStyle}
                    onChange={(e) => setEmailStyle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
                  >
                    {EMAIL_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Length</label>
                  <select
                    value={emailLength}
                    onChange={(e) => setEmailLength(e.target.value)}
                    className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
                  >
                    {EMAIL_LENGTHS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Format</label>
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
                  >
                    <option value="plain">Plain text</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={generateDraft}
                    disabled={drafting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pulse px-4 py-2 text-sm font-medium text-void disabled:opacity-50"
                  >
                    {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </button>
                </div>
              </div>
              {selectedStyle && (
                <p className="text-xs text-muted">
                  {selectedStyle.hint}
                  {emailStyle === 'complete' || emailLength === 'complete'
                    ? ' · Includes greeting, structured sections, CTA, and signature.'
                    : ''}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 font-semibold text-primary">Compose email</h3>
            <div className="space-y-4">
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
                <label className="mb-1 block text-xs text-muted">Body</label>
                <textarea
                  required
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-border bg-void px-3 py-2 font-mono text-sm"
                  placeholder={bodyType === 'html' ? '<p>Hello...</p>' : 'Write your message...'}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Sending to <span className="text-primary">{audienceLabel}</span>
                  {mode === 'custom' ? ' · not platform users' : ''}.
                </p>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg bg-info px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {mode === 'custom' ? 'Send to receiver' : 'Send email'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {mode === 'users' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-pulse" />
                <h3 className="font-semibold text-primary">Recipients</h3>
              </div>
              <div className="space-y-3">
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
                >
                  <option value="selected">Selected users</option>
                  <option value="filtered">Filtered users</option>
                  <option value="all">All users</option>
                </select>
                {(target === 'all' || target === 'filtered') && (
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                    Active users only
                  </label>
                )}
                <p className="rounded-lg border border-border bg-void px-3 py-2 text-sm text-muted">
                  Selected: <span className="text-primary">{selectedIds.length}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 font-semibold text-primary">Find users</h3>
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value)
                      setPage(0)
                    }}
                    placeholder="Search by email"
                    className="w-full rounded-lg border border-border bg-void py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={plan}
                    onChange={(e) => {
                      setPlan(e.target.value)
                      setPage(0)
                    }}
                    className="rounded-lg border border-border bg-void px-3 py-2 text-sm"
                  >
                    <option value="">All plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="max">Max</option>
                  </select>
                  <select
                    value={isActive}
                    onChange={(e) => {
                      setIsActive(e.target.value)
                      setPage(0)
                    }}
                    className="rounded-lg border border-border bg-void px-3 py-2 text-sm"
                  >
                    <option value="">All status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between text-xs text-muted">
                <button type="button" onClick={toggleVisible} className="text-pulse hover:underline">
                  {visibleSelected ? 'Unselect visible' : 'Select visible'}
                </button>
                <span>{total} user(s)</span>
              </div>

              {loadingUsers ? (
                <p className="py-8 text-center text-sm text-muted">Loading users...</p>
              ) : (
                <DataTable
                  keyField="_id"
                  rows={users}
                  emptyMessage="No users found"
                  columns={[
                    {
                      key: 'select',
                      label: '',
                      render: (row) => (
                        <input
                          type="checkbox"
                          checked={selectedSet.has(row._id)}
                          onChange={() => toggleUser(row._id)}
                        />
                      ),
                    },
                    {
                      key: 'email',
                      label: 'Email',
                      render: (row) => (
                        <div>
                          <p className="text-primary">{row.email}</p>
                          <div className="mt-1 flex gap-1">
                            <Badge variant="plan">{row.plan}</Badge>
                            <Badge variant={row.is_active ? 'success' : 'danger'}>
                              {row.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              )}

              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
      )}
    </AppShell>
  )
}
