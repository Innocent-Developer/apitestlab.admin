import { useCallback, useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

const PAGE_SIZE = 20
const TABS = [
  { id: 'requests', label: 'API requests', endpoint: API_ENDPOINTS.ADMIN.HISTORY_REQUESTS },
  { id: 'activity', label: 'User activity', endpoint: API_ENDPOINTS.ADMIN.HISTORY_ACTIVITY },
  { id: 'audit', label: 'Admin audit', endpoint: API_ENDPOINTS.ADMIN.HISTORY_AUDIT },
  { id: 'sessions', label: 'Admin logins', endpoint: API_ENDPOINTS.ADMIN.LOGIN_SESSIONS },
]

const COLUMNS = {
  requests: [
    { key: 'user_id', label: 'User' },
    { key: 'method', label: 'Method' },
    { key: 'url', label: 'URL' },
    { key: 'status_code', label: 'Status' },
    {
      key: 'created_at',
      label: 'When',
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : ''),
    },
  ],
  activity: [
    { key: 'user_id', label: 'User' },
    { key: 'page', label: 'Page' },
    { key: 'event_type', label: 'Event' },
    { key: 'ip_address', label: 'IP' },
    {
      key: 'timestamp',
      label: 'When',
      render: (r) => (r.timestamp ? new Date(r.timestamp).toLocaleString() : ''),
    },
  ],
  audit: [
    { key: 'actor_id', label: 'Actor' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'entity_id', label: 'Entity ID' },
    {
      key: 'created_at',
      label: 'When',
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : ''),
    },
  ],
  sessions: [
    { key: 'email', label: 'Email' },
    { key: 'ip_address', label: 'IP' },
    { key: 'step', label: 'Step' },
    {
      key: 'success',
      label: 'OK',
      render: (r) => (r.success ? 'Yes' : 'No'),
    },
    {
      key: 'created_at',
      label: 'When',
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : ''),
    },
  ],
}

export default function ActivityPage() {
  const [tab, setTab] = useState('requests')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const current = TABS.find((t) => t.id === tab)

  const load = useCallback(async () => {
    if (!current) return
    setLoading(true)
    try {
      const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
      if (q.trim() && tab === 'requests') params.q = q.trim()
      const { data } = await api.get(current.endpoint, { params })
      setRows(data.rows || [])
      setTotal(data.total || 0)
    } catch {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [current, page, q, tab])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AppShell title="Activity monitoring">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setPage(0)
            }}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === t.id ? 'bg-pulse/15 text-pulse' : 'border border-border text-muted hover:bg-surface-hover'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(0)
          }}
          placeholder="Search URL or method…"
          className="mb-4 w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      )}

      <div className="rounded-xl border border-border bg-surface">
        {loading ? (
          <p className="p-6 text-muted">Loading…</p>
        ) : (
          <>
            <DataTable columns={COLUMNS[tab]} rows={rows} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </AppShell>
  )
}
