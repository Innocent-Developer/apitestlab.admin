import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

const PAGE_SIZE = 20

export default function BillingPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timeline, setTimeline] = useState(null)
  const [timelineUser, setTimelineUser] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN.BILLING_USERS, {
        params: { skip: page * PAGE_SIZE, limit: PAGE_SIZE },
      })
      setRows(data.rows || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const openTimeline = async (userId, email) => {
    const { data } = await api.get(API_ENDPOINTS.ADMIN.BILLING_TIMELINE(userId))
    setTimeline(data.events || [])
    setTimelineUser(email)
  }

  const columns = [
    {
      key: 'email',
      label: 'User',
      render: (r) => (
        <Link to={`/users/${r.user_id}`} className="text-info hover:underline">
          {r.email}
        </Link>
      ),
    },
    { key: 'plan', label: 'Plan', render: (r) => <Badge variant="plan">{r.plan}</Badge> },
    {
      key: 'trial',
      label: 'Trial',
      render: (r) => (r.is_trial_active ? 'Active' : ''),
    },
    {
      key: 'renews',
      label: 'Renews',
      render: (r) =>
        r.subscription_renews_at ? new Date(r.subscription_renews_at).toLocaleDateString() : '',
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => openTimeline(r.user_id, r.email)}
          className="text-xs text-pulse hover:underline"
        >
          Timeline
        </button>
      ),
    },
  ]

  return (
    <AppShell title="Billing">
      <div className="rounded-xl border border-border bg-surface">
        {loading ? (
          <p className="p-6 text-muted">Loading billing data…</p>
        ) : (
          <>
            <DataTable columns={columns} rows={rows} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={Boolean(timeline)}
        onClose={() => {
          setTimeline(null)
          setTimelineUser(null)
        }}
        title={`Billing timeline  ${timelineUser}`}
        wide
      >
        {timeline?.length ? (
          <ul className="space-y-3">
            {timeline.map((ev, i) => (
              <li key={i} className="rounded-lg border border-border px-4 py-3 text-sm">
                <span className="font-medium text-primary">{ev.type}</span>
                <span className="ml-2 text-muted">
                  {ev.at ? new Date(ev.at).toLocaleString() : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No billing events recorded.</p>
        )}
      </Modal>
    </AppShell>
  )
}
