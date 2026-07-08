import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  FlaskConical,
  Globe,
  UserCheck,
  UserX,
  Shield,
  TrendingUp,
  Activity,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

function StatCard({ icon: Icon, label, value, sub, accent = 'pulse' }) {
  const accents = {
    pulse: 'from-pulse/20 to-info/10 border-pulse/30',
    info: 'from-info/20 to-pulse/10 border-info/30',
    warn: 'from-warn/20 to-danger/10 border-warn/30',
    danger: 'from-danger/20 to-warn/10 border-danger/30',
  }
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${accents[accent] || accents.pulse}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <div className="rounded-lg bg-void/40 p-2">
          <Icon className="h-5 w-5 text-pulse" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-primary">{value ?? ''}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(API_ENDPOINTS.ADMIN.DASHBOARD)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const chartData = (data?.growth_users || []).map((row) => ({
    day: row.day,
    signups: row.count ?? 0,
  }))

  const activeRate =
    data?.total_users > 0
      ? Math.round((data.active_users / data.total_users) * 100)
      : 0

  return (
    <AppShell title="Dashboard">
      {loading ? (
        <p className="text-muted">Loading dashboard…</p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface/80 p-5">
            <h2 className="text-lg font-semibold text-primary">Overview</h2>
            <p className="mt-1 text-sm text-muted">
              Platform health at a glance  users, tests, and growth.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total users" value={data?.total_users} accent="info" />
            <StatCard
              icon={UserCheck}
              label="Active users"
              value={data?.active_users}
              sub={`${activeRate}% active`}
              accent="pulse"
            />
            <StatCard icon={FlaskConical} label="API tests run" value={data?.total_tests} accent="warn" />
            <StatCard icon={Globe} label="Traffic events" value={data?.total_traffic_records} accent="danger" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pulse" />
                <h3 className="font-semibold text-primary">New signups (14 days)</h3>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted">No signup data yet.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1E2733" strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B7785' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7785' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#10161F',
                          border: '1px solid #1E2733',
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="signups"
                        stroke="#5EEAD4"
                        fill="url(#signupGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 font-semibold text-primary">Plans</h3>
              <div className="space-y-3">
                {data?.plans &&
                  Object.entries(data.plans).map(([plan, count]) => {
                    const pct =
                      data.total_users > 0 ? Math.round((count / data.total_users) * 100) : 0
                    return (
                      <div key={plan}>
                        <div className="mb-1 flex justify-between text-sm">
                          <Badge variant="plan">{plan}</Badge>
                          <span className="text-primary">{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-void">
                          <div
                            className="h-full rounded-full bg-pulse/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-muted">
                <p className="flex items-center gap-2">
                  <UserX className="h-4 w-4" /> Inactive: {data?.inactive_users ?? 0}
                </p>
                <p className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admins: {data?.admin_count ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-4 py-3 font-semibold text-primary">
                Recent signups
              </div>
              <div className="divide-y divide-border/60">
                {(data?.recent_users || []).map((u) => (
                  <Link
                    key={u._id}
                    to={`/users/${u._id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-hover"
                  >
                    <span className="text-primary">{u.email}</span>
                    <Badge variant="plan">{u.plan}</Badge>
                  </Link>
                ))}
                {!data?.recent_users?.length && (
                  <p className="px-4 py-6 text-sm text-muted">No users yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-semibold text-primary">
                <Activity className="h-4 w-4 text-pulse" />
                Recent admin actions
              </div>
              <div className="divide-y divide-border/60">
                {(data?.recent_audit || []).map((a) => (
                  <div key={a.id} className="px-4 py-3 text-sm">
                    <p className="text-primary">{a.action}</p>
                    <p className="text-xs text-muted">
                      {a.entity} · {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                ))}
                {!data?.recent_audit?.length && (
                  <p className="px-4 py-6 text-sm text-muted">No audit entries yet.</p>
                )}
              </div>
            </div>
          </div>

          {data?.timestamp && (
            <p className="text-xs text-muted">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </AppShell>
  )
}
