import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Mail } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'
import { useToast } from '../components/ui/Toast'
import SendEmailModal from '../components/users/SendEmailModal'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'
import { downloadAdminExport } from '../lib/download'

export default function UserDetailPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [activity, setActivity] = useState([])
  const [form, setForm] = useState({})
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [emailOpen, setEmailOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userRes, actRes] = await Promise.all([
        api.get(API_ENDPOINTS.ADMIN.USER(id)),
        api.get(API_ENDPOINTS.ADMIN.HISTORY_REQUESTS, { params: { user_id: id, limit: 10 } }),
      ])
      setUser(userRes.data)
      setForm({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        is_active: userRes.data.is_active,
        api_limit: userRes.data.api_limit,
        is_admin: userRes.data.is_admin,
      })
      setPlan(userRes.data.plan)
      setActivity(actRes.data.rows || [])
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    try {
      await api.patch(API_ENDPOINTS.ADMIN.USER(id), form)
      toast('User updated', 'success')
      load()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    }
  }

  const changePlan = async () => {
    try {
      await api.put(API_ENDPOINTS.ADMIN.USER_PLAN(id), { plan })
      toast('Plan updated', 'success')
      load()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    }
  }

  const resetUsage = async () => {
    try {
      await api.post(API_ENDPOINTS.ADMIN.USER_RESET_USAGE(id))
      toast('API usage reset', 'success')
      load()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    }
  }

  const exportUser = async (format) => {
    setExporting(true)
    try {
      await downloadAdminExport(API_ENDPOINTS.ADMIN.USER_EXPORT(id), { format })
      toast(`Downloaded ${format.toUpperCase()}`, 'success')
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="User detail">
        <p className="text-muted">Loading…</p>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell title="User detail">
        <p className="text-danger">User not found</p>
      </AppShell>
    )
  }

  return (
    <AppShell title="User detail">
      <Link to="/users" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-pulse">
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="mb-6 rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-primary">{user.email}</h2>
          <Badge variant="plan">{user.plan}</Badge>
          <Badge variant={user.is_active ? 'success' : 'danger'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {user.is_admin && <Badge>Admin</Badge>}
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEmailOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-hover"
            >
              <Mail className="h-4 w-4" /> Email
            </button>
            {['csv', 'xlsx', 'pdf'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                disabled={exporting}
                onClick={() => exportUser(fmt)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs uppercase text-muted hover:bg-surface-hover disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {fmt}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <span className="text-muted">API used:</span> {user.api_used} / {user.api_limit === -1 ? '∞' : user.api_limit}
          </p>
          <p>
            <span className="text-muted">Created:</span>{' '}
            {user.created_at ? new Date(user.created_at).toLocaleString() : ''}
          </p>
          <p>
            <span className="text-muted">Trial:</span> {user.is_trial_active ? 'Active' : 'No'}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold text-primary">Edit profile</h3>
          <div className="space-y-3">
            {['first_name', 'last_name'].map((f) => (
              <div key={f}>
                <label className="mb-1 block text-xs text-muted">{f.replace('_', ' ')}</label>
                <input
                  value={form[f]}
                  onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs text-muted">API limit (-1 = unlimited)</label>
              <input
                type="number"
                value={form.api_limit}
                onChange={(e) => setForm((p) => ({ ...p, api_limit: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm((p) => ({ ...p, is_admin: e.target.checked }))}
              />
              Admin
            </label>
            <button type="button" onClick={save} className="rounded-lg bg-info px-4 py-2 text-sm text-white">
              Save changes
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold text-primary">Change plan</h3>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="mb-3 w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="max">Max</option>
          </select>
          <button type="button" onClick={changePlan} className="rounded-lg bg-pulse px-4 py-2 text-sm text-void">
            Update plan
          </button>
          <button
            type="button"
            onClick={resetUsage}
            className="ml-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-surface-hover"
          >
            Reset API usage
          </button>
          <div className="mt-4 space-y-1 text-xs text-muted">
            {user.freemius_license_id && <p>License: {user.freemius_license_id}</p>}
            {user.subscription_renews_at && (
              <p>Renews: {new Date(user.subscription_renews_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <h3 className="border-b border-border px-4 py-3 font-semibold text-primary">Recent API requests</h3>
        <DataTable
          columns={[
            { key: 'method', label: 'Method' },
            { key: 'url', label: 'URL' },
            { key: 'status_code', label: 'Status' },
            {
              key: 'created_at',
              label: 'When',
              render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : ''),
            },
          ]}
          rows={activity}
          emptyMessage="No recent requests"
        />
      </div>

      <SendEmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        initialUser={user}
        onSent={(msg) => toast(msg, 'success')}
      />
    </AppShell>
  )
}
