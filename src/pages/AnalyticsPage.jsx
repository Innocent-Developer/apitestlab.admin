import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import AppShell from '../components/layout/AppShell'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [metric, setMetric] = useState('all') // all | users | tests | traffic

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get(API_ENDPOINTS.ADMIN.GROWTH, { params: { days } })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => {
    setStatsLoading(true)
    api
      .get(API_ENDPOINTS.ADMIN.STATS)
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  const usersByDay = Object.fromEntries((data?.users || []).map((r) => [r.day || r.date, r.count ?? 0]))
  const testsByDay = Object.fromEntries((data?.tests || []).map((r) => [r.day || r.date, r.count ?? 0]))
  const trafficByDay = Object.fromEntries(
    (data?.traffic || []).map((r) => [r.day || r.date, r.count ?? 0]),
  )

  const allDates = Array.from(
    new Set([...Object.keys(usersByDay), ...Object.keys(testsByDay), ...Object.keys(trafficByDay)]),
  ).sort()

  const chartData = allDates.map((date) => ({
    date,
    users: usersByDay[date] || 0,
    tests: testsByDay[date] || 0,
    traffic: trafficByDay[date] || 0,
  }))

  const growthTotals = chartData.reduce(
    (acc, row) => {
      acc.users += row.users
      acc.tests += row.tests
      acc.traffic += row.traffic
      return acc
    },
    { users: 0, tests: 0, traffic: 0 },
  )

  const testsPerSignup =
    growthTotals.users > 0 ? Math.round((growthTotals.tests / growthTotals.users) * 10) / 10 : null
  const trafficPerSignup =
    growthTotals.users > 0 ? Math.round((growthTotals.traffic / growthTotals.users) * 10) / 10 : null

  const planData = stats?.plans
    ? Object.entries(stats.plans).map(([name, value]) => ({ name, value }))
    : []

  const activityInactive = stats ? Math.max(0, stats.total_users - stats.active_users) : 0
  const activityData = [
    { name: 'Active', value: stats?.active_users ?? 0, key: 'active' },
    { name: 'Inactive', value: activityInactive, key: 'inactive' },
  ]

  const COLORS = {
    users: '#5EEAD4',
    tests: '#6C8EF5',
    traffic: '#F5A623',
    active: '#5EEAD4',
    inactive: '#F0506E',
    free: '#6C8EF5',
    pro: '#5EEAD4',
    max: '#F5A623',
  }

  return (
    <AppShell title="Analytics">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted">Period</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>

        <label className="text-sm text-muted">Metric</label>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">All (users/tests/traffic)</option>
          <option value="users">Users (signups)</option>
          <option value="tests">API tests</option>
          <option value="traffic">Traffic events</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        {loading ? (
          <p className="text-muted">Loading growth data…</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted">No growth data available for this period.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1E2733" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#6B7785" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6B7785" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#10161F', border: '1px solid #1E2733', borderRadius: 8 }}
                />

                {metric === 'all' || metric === 'users' ? (
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke={COLORS.users}
                    strokeWidth={2}
                    dot={false}
                    name="Users"
                  />
                ) : null}
                {metric === 'all' || metric === 'tests' ? (
                  <Line
                    type="monotone"
                    dataKey="tests"
                    stroke={COLORS.tests}
                    strokeWidth={2}
                    dot={false}
                    name="API tests"
                  />
                ) : null}
                {metric === 'all' || metric === 'traffic' ? (
                  <Line
                    type="monotone"
                    dataKey="traffic"
                    stroke={COLORS.traffic}
                    strokeWidth={2}
                    dot={false}
                    name="Traffic"
                  />
                ) : null}

                {metric === 'all' ? <Legend /> : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-semibold text-primary">Plan distribution</h3>
          {statsLoading ? (
            <p className="text-muted">Loading plan stats…</p>
          ) : planData.length === 0 ? (
            <p className="text-muted">No plan stats available.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {planData.map((p) => (
                      <Cell key={p.name} fill={COLORS[p.name] || COLORS.pro} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 text-xs text-muted">Based on total users in each plan.</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-semibold text-primary">User activity</h3>
          {statsLoading ? (
            <p className="text-muted">Loading activity stats…</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityData.map((p) => (
                      <Cell
                        key={p.key}
                        fill={COLORS[p.key] || COLORS.inactive}
                        stroke="rgba(0,0,0,0)"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 space-y-1 text-xs text-muted">
            <p>
              Active: <span className="text-primary">{stats?.active_users ?? 0}</span>
            </p>
            <p>
              Inactive: <span className="text-primary">{activityInactive}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">New users ({days}d)</p>
          <p className="text-2xl font-bold text-primary">{growthTotals.users}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">API tests ({days}d)</p>
          <p className="text-2xl font-bold text-primary">{growthTotals.tests}</p>
          <p className="mt-1 text-xs text-muted">
            Tests per new user: {testsPerSignup === null ? '—' : testsPerSignup}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Traffic events ({days}d)</p>
          <p className="text-2xl font-bold text-primary">{growthTotals.traffic}</p>
          <p className="mt-1 text-xs text-muted">
            Traffic per new user: {trafficPerSignup === null ? '—' : trafficPerSignup}
          </p>
        </div>
      </div>
    </AppShell>
  )
}
