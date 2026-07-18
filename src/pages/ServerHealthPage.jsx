import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  Timer,
  Wifi,
} from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import api from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'

const REFRESH_MS = 30_000

function statusVariant(status) {
  if (status === 'healthy') return 'success'
  if (status === 'warning') return 'warn'
  return 'danger'
}

function MetricBar({ label, value, used, total, icon: Icon, accent = 'pulse' }) {
  const colors = {
    pulse: 'bg-pulse',
    info: 'bg-info',
    warn: 'bg-warn',
    danger: 'bg-danger',
  }
  const barColor = value >= 95 ? colors.danger : value >= 85 ? colors.warn : colors[accent] || colors.pulse

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-pulse" />
          <span className="text-sm font-medium text-primary">{label}</span>
        </div>
        <span className="text-2xl font-bold text-primary">{value}%</span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-void">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="text-xs text-muted">
        {used} used · {total} total
      </p>
    </div>
  )
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-sm text-primary ${mono ? 'font-mono break-all' : ''}`}>{value ?? ''}</span>
    </div>
  )
}

export default function ServerHealthPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await api.get(API_ENDPOINTS.ADMIN.SERVER_HEALTH)
      setData(res.data)
      setLastFetch(new Date())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(() => load(true), REFRESH_MS)
    return () => window.clearInterval(id)
  }, [load])

  const host = data?.host
  const mongo = data?.mongodb

  return (
    <AppShell title="Server health">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/80 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-pulse/10 p-2 text-pulse">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">VPS health</h2>
            <p className="text-sm text-muted">Live CPU, memory, disk, uptime, and database status.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data?.status && <Badge variant={statusVariant(data.status)}>{data.status}</Badge>}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <p className="text-muted">Loading server metrics…</p>
      ) : !data ? (
        <p className="text-danger">Could not load server health. Check backend access.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricBar
              label="CPU"
              value={host?.cpu?.percent ?? 0}
              used={`${host?.cpu?.percent ?? 0}%`}
              total={`${host?.cpu?.cores_logical ?? 0} cores`}
              icon={Cpu}
              accent="info"
            />
            <MetricBar
              label="Memory (RAM)"
              value={host?.memory?.percent ?? 0}
              used={host?.memory?.used}
              total={host?.memory?.total}
              icon={MemoryStick}
            />
            <MetricBar
              label="Disk"
              value={host?.disk?.percent ?? 0}
              used={host?.disk?.used}
              total={host?.disk?.total}
              icon={HardDrive}
              accent="warn"
            />
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <Timer className="h-4 w-4 text-pulse" />
                <span className="text-sm font-medium text-primary">Uptime</span>
              </div>
              <p className="text-2xl font-bold text-primary">{host?.uptime?.human}</p>
              <p className="mt-2 text-xs text-muted">
                Boot: {host?.uptime?.boot_time ? new Date(host.uptime.boot_time).toLocaleString() : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-pulse" />
                <h3 className="font-semibold text-primary">MongoDB</h3>
                <Badge variant={mongo?.connected ? 'success' : 'danger'}>
                  {mongo?.connected ? 'Connected' : 'Down'}
                </Badge>
              </div>
              <div className="space-y-3">
                <InfoRow label="Database" value={mongo?.database} />
                <InfoRow label="Ping" value={mongo?.ping_ms != null ? `${mongo.ping_ms} ms` : ''} />
                <InfoRow label="Collections" value={mongo?.collections} />
                {mongo?.error && (
                  <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                    {mongo.error}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-pulse" />
                <h3 className="font-semibold text-primary">System load</h3>
              </div>
              <div className="space-y-3">
                <InfoRow
                  label="Load average (1 / 5 / 15 min)"
                  value={
                    host?.load_average
                      ? host.load_average.map((n) => n.toFixed(2)).join(' · ')
                      : 'Not available on this OS'
                  }
                />
                <InfoRow label="Running processes" value={host?.processes} />
                <InfoRow
                  label="Swap"
                  value={
                    host?.swap?.total_bytes
                      ? `${host.swap.used} / ${host.swap.total} (${host.swap.percent}%)`
                      : 'No swap'
                  }
                />
                <InfoRow
                  label="Network (total)"
                  value={host?.network ? `↑ ${host.network.sent} · ↓ ${host.network.recv}` : ''}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-pulse" />
              <h3 className="font-semibold text-primary">Host details</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Hostname" value={host?.hostname} mono />
              <InfoRow label="OS" value={`${host?.platform?.system} ${host?.platform?.release}`} />
              <InfoRow label="Architecture" value={host?.platform?.machine} />
              <InfoRow label="Processor" value={host?.platform?.processor} />
              <InfoRow label="Python" value={host?.python_version} />
              <InfoRow label="App version" value={host?.app?.version} />
              <InfoRow label="Environment" value={host?.app?.environment} />
              <InfoRow label="Disk path" value={host?.disk?.path} mono />
              <InfoRow
                label="Free disk"
                value={host?.disk?.free ? `${host.disk.free} free` : ''}
              />
            </div>
          </div>

          <p className="text-xs text-muted">
            Auto-refresh every {REFRESH_MS / 1000}s
            {lastFetch ? ` · Last updated ${lastFetch.toLocaleTimeString()}` : ''}
            {data.timestamp ? ` · Server time ${new Date(data.timestamp).toLocaleString()}` : ''}
          </p>
        </div>
      )}
    </AppShell>
  )
}
