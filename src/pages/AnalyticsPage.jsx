import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import AppShell from '../components/layout/AppShell'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get(API_ENDPOINTS.ADMIN.GROWTH, { params: { days } })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [days])

  const chartData = (data?.users || []).map((row) => ({
    date: row.day || row.date,
    signups: row.count ?? 0,
  }))

  return (
    <AppShell title="Analytics">
      <div className="mb-4 flex items-center gap-3">
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
                <Line type="monotone" dataKey="signups" stroke="#5EEAD4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {data?.totals && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Object.entries(data.totals).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">{k.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold text-primary">{v}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
