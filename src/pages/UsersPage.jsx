import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

const PAGE_SIZE = 10

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState('')
  const [isActive, setIsActive] = useState('')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    plan: 'free',
    is_admin: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [page, q, plan, isActive, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post(API_ENDPOINTS.ADMIN.USERS, form)
      toast('User created', 'success')
      setCreateOpen(false)
      setForm({ email: '', password: '', first_name: '', last_name: '', plan: 'free', is_admin: false })
      load()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    }
  }

  const runAction = async (action, userId) => {
    try {
      if (action === 'activate') await api.post(API_ENDPOINTS.ADMIN.USER_ACTIVATE(userId))
      if (action === 'deactivate') await api.post(API_ENDPOINTS.ADMIN.USER_DEACTIVATE(userId))
      if (action === 'reset') await api.post(API_ENDPOINTS.ADMIN.USER_RESET_USAGE(userId))
      if (action === 'delete') await api.delete(API_ENDPOINTS.ADMIN.USER(userId))
      toast(`User ${action}d`, 'success')
      load()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setConfirm(null)
    }
  }

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <Link to={`/users/${row._id}`} className="text-info hover:underline">
          {row.email}
        </Link>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—',
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => <Badge variant="plan">{row.plan}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'admin',
      label: 'Role',
      render: (row) => (row.is_admin ? <Badge>Admin</Badge> : <span className="text-muted">User</span>),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Link
            to={`/users/${row._id}`}
            className="rounded border border-border px-2 py-0.5 text-xs hover:bg-surface-hover"
          >
            Edit
          </Link>
          {row.is_active ? (
            <button
              type="button"
              onClick={() => setConfirm({ action: 'deactivate', id: row._id, email: row.email })}
              className="rounded border border-border px-2 py-0.5 text-xs text-warn hover:bg-surface-hover"
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runAction('activate', row._id)}
              className="rounded border border-border px-2 py-0.5 text-xs text-pulse hover:bg-surface-hover"
            >
              Activate
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirm({ action: 'delete', id: row._id, email: row.email })}
            className="rounded border border-danger/40 px-2 py-0.5 text-xs text-danger hover:bg-danger/10"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppShell title="Users">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
            placeholder="Search by email…"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-pulse/40"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white hover:bg-info/90"
        >
          <Plus className="h-4 w-4" />
          Create user
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        {loading ? (
          <p className="p-6 text-muted">Loading users…</p>
        ) : (
          <>
            <DataTable columns={columns} rows={users} keyField="_id" />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user" wide>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          {['email', 'password', 'first_name', 'last_name'].map((field) => (
            <div key={field} className={field === 'email' || field === 'password' ? 'sm:col-span-2' : ''}>
              <label className="mb-1 block text-xs text-muted">{field.replace('_', ' ')}</label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                required={field !== 'last_name'}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-muted">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="max">Max</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
            />
            Admin user
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-info px-4 py-2 text-sm text-white">
              Create
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => runAction(confirm?.action, confirm?.id)}
        title={confirm?.action === 'delete' ? 'Delete user' : 'Deactivate user'}
        message={`Are you sure you want to ${confirm?.action} ${confirm?.email}?`}
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : 'Deactivate'}
        danger={confirm?.action === 'delete'}
      />
    </AppShell>
  )
}
