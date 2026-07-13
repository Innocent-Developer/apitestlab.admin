import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, UserX, GitBranch, Mail } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Badge from '../components/ui/Badge'
import ReferralGraphView from '../components/referrals/ReferralGraphView'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'
import { useToast } from '../components/ui/Toast'

const PAGE_SIZE = 25

const STATUS_FILTERS = [
  { id: '', label: 'All users' },
  { id: 'idle', label: 'No activity' },
  { id: 'inviting', label: 'Invites sent' },
  { id: 'in_progress', label: 'In progress (1–4)' },
  { id: 'complete_pro', label: 'Pro unlocked (5+)' },
  { id: 'complete_max', label: 'Max unlocked (20+)' },
]

const STATUS_MAP = {
  idle: { label: 'No activity', variant: 'default' },
  inviting: { label: 'Invites sent', variant: 'warn' },
  in_progress: { label: 'In progress', variant: 'default' },
  complete_pro: { label: 'Pro unlocked', variant: 'success' },
  complete_max: { label: 'Max unlocked', variant: 'success' },
}

export default function ReferralsPage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [graph, setGraph] = useState(null)
  const [graphLoading, setGraphLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
      if (q.trim()) params.q = q.trim()
      if (status) params.status = status
      const { data } = await api.get(API_ENDPOINTS.ADMIN.REFERRALS_OVERVIEW, { params })
      setSummary(data.summary)
      setRows(data.rows || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [page, q, status, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setGraphLoading(true)
    api
      .get(API_ENDPOINTS.ADMIN.REFERRALS_GRAPH, { params: { limit: 200 } })
      .then((res) => setGraph(res.data))
      .catch(() => setGraph(null))
      .finally(() => setGraphLoading(false))
  }, [])

  const columns = [
    {
      key: 'email',
      label: 'User',
      render: (r) => (
        <Link to={`/users/${r.user_id}?tab=referrals`} className="text-info hover:underline">
          {r.email}
        </Link>
      ),
    },
    {
      key: 'referral_code',
      label: 'Code',
      render: (r) => (
        <span className="font-mono text-xs text-pulse">{r.referral_code || '—'}</span>
      ),
    },
    {
      key: 'qualified_count',
      label: 'Signups',
      render: (r) => <span className="font-semibold">{r.qualified_count}</span>,
    },
    {
      key: 'invites',
      label: 'Invites',
      render: (r) => (
        <span className="text-sm text-muted">
          {r.sent_invites} sent
          {r.pending_invites > 0 && (
            <span className="text-warn"> · {r.pending_invites} pending</span>
          )}
        </span>
      ),
    },
    {
      key: 'referred_by',
      label: 'Referred by',
      render: (r) =>
        r.referred_by ? (
          <Link
            to={`/users/${r.referred_by.user_id}?tab=referrals`}
            className="text-xs text-info hover:underline"
          >
            {r.referred_by.email}
          </Link>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const st = STATUS_MAP[r.status] || STATUS_MAP.idle
        return <Badge variant={st.variant}>{st.label}</Badge>
      },
    },
  ]

  return (
    <AppShell title="Referrals">
      <p className="mb-6 text-sm text-muted">
        See who invited whom, which users have no referral activity, and who completed reward tiers.
      </p>

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { icon: Users, label: 'Total users', value: summary.total_users },
            { icon: GitBranch, label: 'With signups', value: summary.users_with_referrals },
            { icon: UserX, label: 'No activity', value: summary.users_no_invite_activity },
            { icon: GitBranch, label: 'Conversions', value: summary.total_conversions },
            { icon: Users, label: 'Referred signups', value: summary.total_referred_signups },
            { icon: Mail, label: 'Pending invites', value: summary.pending_email_invites },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="text-2xl font-bold text-primary">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold text-primary">Referral link graph</h2>
        {graphLoading ? (
          <p className="text-sm text-muted">Loading graph…</p>
        ) : (
          <ReferralGraphView nodes={graph?.nodes} edges={graph?.edges} />
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search by email…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
            className="w-full rounded-lg border border-border bg-void py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-border bg-void px-3 py-2 text-sm"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.id || 'all'} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <DataTable columns={columns} rows={rows} keyField="user_id" />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </AppShell>
  )
}
