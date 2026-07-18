import { Link } from 'react-router-dom'
import { Copy, ExternalLink } from 'lucide-react'
import Badge from '../ui/Badge'
import DataTable from '../ui/DataTable'
import { ReferralTreeGraph } from './ReferralGraphView'

const STATUS_MAP = {
  idle: { label: 'No activity', variant: 'default' },
  inviting: { label: 'Invites sent', variant: 'warn' },
  in_progress: { label: 'In progress', variant: 'default' },
  complete_pro: { label: 'Pro unlocked', variant: 'success' },
  complete_max: { label: 'Max unlocked', variant: 'success' },
}

function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString()
}

export default function UserReferralPanel({ data, onCopy }) {
  if (!data) return <p className="text-sm text-muted">Loading referral data…</p>

  const st = STATUS_MAP[data.status] || STATUS_MAP.idle

  const inviteColumns = [
    { key: 'to_email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'converted' ? 'success' : r.status === 'pending' ? 'warn' : 'default'}>
          {r.status}
        </Badge>
      ),
    },
    { key: 'created_at', label: 'Sent', render: (r) => fmtDate(r.created_at) },
    { key: 'converted_at', label: 'Converted', render: (r) => fmtDate(r.converted_at) },
  ]

  const referralColumns = [
    {
      key: 'email',
      label: 'User',
      render: (r) => (
        <Link to={`/users/${r.user_id}?tab=referrals`} className="text-info hover:underline">
          {r.email}
        </Link>
      ),
    },
    { key: 'source', label: 'Source' },
    { key: 'plan', label: 'Plan', render: (r) => (r.plan ? <Badge variant="plan">{r.plan}</Badge> : '') },
    { key: 'created_at', label: 'Signed up', render: (r) => fmtDate(r.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Qualified signups</p>
          <p className="text-2xl font-bold text-primary">{data.qualified_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Email invites</p>
          <p className="text-2xl font-bold text-primary">
            {data.sent_invites}
            <span className="text-sm font-normal text-muted"> ({data.pending_invites} pending)</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Status</p>
          <div className="mt-1">
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Reward plan</p>
          <p className="text-lg font-semibold text-primary">
            {data.active_reward_plan || ''}
          </p>
          {data.active_reward_expires_at && (
            <p className="text-[10px] text-muted">until {fmtDate(data.active_reward_expires_at)}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-semibold text-primary">Referral link</h3>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-border bg-void px-3 py-2 text-sm text-pulse">
            {data.referral_code}
          </code>
          <button
            type="button"
            onClick={() => onCopy?.(data.referral_code)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-hover"
          >
            <Copy className="h-4 w-4" />
          </button>
          {data.referral_link && (
            <a
              href={data.referral_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-info hover:underline"
            >
              Open link <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {data.referred_by && (
          <p className="mt-3 text-sm text-muted">
            Referred by{' '}
            <Link
              to={`/users/${data.referred_by.user_id}?tab=referrals`}
              className="text-info hover:underline"
            >
              {data.referred_by.email}
            </Link>
            {data.referred_by.referral_code && (
              <span className="ml-2 font-mono text-xs">({data.referred_by.referral_code})</span>
            )}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-semibold text-primary">Link graph</h3>
        <ReferralTreeGraph nodes={data.graph?.nodes} edges={data.graph?.edges} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-semibold text-primary">Tier progress</h3>
        <div className="flex flex-wrap gap-3">
          {(data.tiers || []).map((t) => (
            <div
              key={t.threshold}
              className={`rounded-lg border px-4 py-3 text-sm ${
                t.unlocked ? 'border-pulse/50 bg-pulse/10' : 'border-border bg-void'
              }`}
            >
              <p className="font-medium">{t.label}</p>
              <p className="text-xs text-muted">{t.threshold} signups → {t.plan}</p>
              <Badge variant={t.unlocked ? 'success' : 'default'} className="mt-2">
                {t.unlocked ? 'Unlocked' : 'Locked'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-semibold text-primary">
          Referred users ({data.referrals?.length || 0})
        </h3>
        {data.referrals?.length ? (
          <DataTable columns={referralColumns} rows={data.referrals} keyField="user_id" />
        ) : (
          <p className="text-sm text-muted">No signups from this user&apos;s link yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-semibold text-primary">
          Email invites ({data.invites?.length || 0})
        </h3>
        {data.invites?.length ? (
          <DataTable columns={inviteColumns} rows={data.invites} keyField="id" />
        ) : (
          <p className="text-sm text-muted">No email invites sent.</p>
        )}
      </div>

      {data.rewards?.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold text-primary">Rewards granted</h3>
          <ul className="space-y-2 text-sm">
            {data.rewards.map((r, i) => (
              <li key={i} className="flex flex-wrap gap-2 text-muted">
                <Badge variant="plan">{r.plan}</Badge>
                <span>{r.tier_threshold} signups tier</span>
                <span>· granted {fmtDate(r.granted_at)}</span>
                {r.expires_at && <span>· expires {fmtDate(r.expires_at)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
