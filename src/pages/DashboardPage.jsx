import { useEffect, useState } from 'react'
import { Users, FlaskConical, Globe } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="h-5 w-5 text-pulse/70" />
      </div>
      <p className="text-3xl font-bold text-primary">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(API_ENDPOINTS.ADMIN.STATS),
      api.get(API_ENDPOINTS.ADMIN.DASHBOARD),
    ])
      .then(([statsRes, dashRes]) => {
        setStats({ ...statsRes.data, ...dashRes.data })
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell title="Dashboard">
      {loading ? (
        <p className="text-muted">Loading dashboard…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total users" value={stats?.total_users} />
            <StatCard icon={Users} label="Active users" value={stats?.active_users} />
            <StatCard icon={FlaskConical} label="Total tests" value={stats?.total_tests} />
            <StatCard icon={Globe} label="Traffic records" value={stats?.total_traffic_records} />
          </div>

          {stats?.plans && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-4 text-sm font-semibold text-primary">Users by plan</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.plans).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2">
                    <Badge variant="plan">{plan}</Badge>
                    <span className="text-lg font-semibold text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.timestamp && (
            <p className="mt-4 text-xs text-muted">Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
          )}
        </>
      )}
    </AppShell>
  )
}
