import { Link } from 'react-router-dom'
import { ArrowRight, Link2, Mail } from 'lucide-react'

const ROLE_STYLES = {
  center: 'border-pulse bg-pulse/10 ring-2 ring-pulse/40',
  referrer: 'border-info bg-info/10',
  referred: 'border-border bg-void',
}

function NodeCard({ node, highlight }) {
  const role = node.role || 'referred'
  return (
    <div
      className={`min-w-[140px] max-w-[200px] rounded-lg border px-3 py-2 text-xs ${
        highlight ? ROLE_STYLES.center : ROLE_STYLES[role] || ROLE_STYLES.referred
      }`}
    >
      <p className="truncate font-medium text-primary">{node.label || node.email}</p>
      <p className="truncate text-[10px] text-muted">{node.email}</p>
      {node.referral_code && (
        <p className="mt-1 font-mono text-[10px] text-pulse">{node.referral_code}</p>
      )}
      {node.qualified_count != null && node.qualified_count > 0 && (
        <p className="mt-1 text-[10px] text-muted">{node.qualified_count} signups</p>
      )}
    </div>
  )
}

function SourceBadge({ source }) {
  const isEmail = source === 'email'
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
      {isEmail ? <Mail className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      {source === 'parent' ? 'referred by' : source}
    </span>
  )
}

/** Visual referral tree: center user, referrer above, referrals below. */
export function ReferralTreeGraph({ nodes, edges }) {
  if (!nodes?.length) {
    return <p className="text-sm text-muted">No referral links yet.</p>
  }

  const center = nodes.find((n) => n.role === 'center') || nodes[0]
  const referrer = nodes.find((n) => n.role === 'referrer')
  const referred = nodes.filter((n) => n.role === 'referred')

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {referrer && (
        <>
          <Link to={`/users/${referrer.user_id || referrer.id}?tab=referrals`} className="hover:opacity-90">
            <NodeCard node={referrer} />
          </Link>
          <div className="flex flex-col items-center text-muted">
            <div className="h-6 w-px bg-border" />
            <SourceBadge source="parent" />
            <div className="h-6 w-px bg-border" />
          </div>
        </>
      )}

      <NodeCard node={center} highlight />

      {referred.length > 0 && (
        <>
          <div className="flex flex-col items-center text-muted">
            <div className="h-6 w-px bg-border" />
            <span className="text-[10px]">referred {referred.length}</span>
            <div className="h-6 w-px bg-border" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {referred.map((n) => {
              const edge = edges?.find((e) => e.to === n.id)
              return (
                <div key={n.id} className="flex flex-col items-center gap-2">
                  <SourceBadge source={edge?.source || n.source || 'link'} />
                  <Link to={`/users/${n.id}?tab=referrals`} className="hover:opacity-90">
                    <NodeCard node={n} />
                  </Link>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/** Global graph: list of referrer → referred connections. */
export default function ReferralGraphView({ nodes, edges }) {
  if (!edges?.length) {
    return <p className="text-sm text-muted">No referral conversions recorded yet.</p>
  }

  const byId = Object.fromEntries((nodes || []).map((n) => [n.id, n]))

  return (
    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
      {edges.map((edge, i) => {
        const from = byId[edge.from]
        const to = byId[edge.to]
        if (!from || !to) return null
        return (
          <div
            key={`${edge.from}-${edge.to}-${i}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-void/50 px-3 py-2 text-sm"
          >
            <Link to={`/users/${from.id}?tab=referrals`} className="text-info hover:underline">
              {from.label || from.email}
            </Link>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
            <Link to={`/users/${to.id}?tab=referrals`} className="text-info hover:underline">
              {to.label || to.email}
            </Link>
            <SourceBadge source={edge.source} />
            {edge.created_at && (
              <span className="ml-auto text-[10px] text-muted">
                {new Date(edge.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
