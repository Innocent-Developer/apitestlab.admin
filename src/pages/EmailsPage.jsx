import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Mail, Search, Sparkles, Users } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import { useToast } from '../components/ui/Toast'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

const PAGE_SIZE = 20

export default function EmailsPage() {
  const { toast } = useToast()
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

  const [aiPrompt, setAiPrompt] = useState('')
  const [tone, setTone] = useState('friendly')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [bodyType, setBodyType] = useState('plain')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)

  const loadUsers = useCallback(async () => {
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
  }, [page, q, plan, isActive, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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

  const audienceLabel =
    target === 'all'
      ? onlyActive
        ? 'all active users'
        : 'all users'
      : target === 'filtered'
        ? 'currently filtered users'
        : `${selectedIds.length} selected user(s)`

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
        tone,
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
    if (target === 'selected' && selectedIds.length === 0) {
      toast('Select at least one user.', 'error')
      return
    }
    setSending(true)
    try {
      const payload = {
        subject,
        body,
        body_type: bodyType,
        target,
        only_active: onlyActive,
      }
      if (target === 'selected') payload.user_ids = selectedIds
      if (target === 'filtered') {
        if (q.trim()) payload.q = q.trim()
        if (plan) payload.plan = plan
        if (isActive !== '') payload.is_active = isActive === 'true'
      }
      if (target === 'all' && plan) payload.plan = plan

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg bg-pulse/10 p-2 text-pulse">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Email center</h2>
            <p className="text-sm text-muted">
              Write with AI, review the message, then send to all, filtered, or selected users.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form onSubmit={sendEmail} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pulse" />
              <h3 className="font-semibold text-primary">AI writer</h3>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_160px_140px]">
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: Write a friendly email announcing Pro plan access and explaining the new benefits."
                className="rounded-lg border border-border bg-void px-3 py-2 text-sm"
              />
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-lg border border-border bg-void px-3 py-2 text-sm"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="urgent">Urgent</option>
                <option value="short">Short</option>
                <option value="marketing">Marketing</option>
              </select>
              <button
                type="button"
                onClick={generateDraft}
                disabled={drafting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-pulse px-4 py-2 text-sm font-medium text-void disabled:opacity-50"
              >
                {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </button>
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
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-border bg-void px-3 py-2 font-mono text-sm"
                  placeholder={bodyType === 'html' ? '<p>Hello...</p>' : 'Write your message...'}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Sending to <span className="text-primary">{audienceLabel}</span>.
                </p>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg bg-info px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send email
                </button>
              </div>
            </div>
          </div>
        </form>

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

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
