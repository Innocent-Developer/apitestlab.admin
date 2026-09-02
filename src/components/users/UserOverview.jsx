import {
  User,
  Phone,
  MapPin,
  CreditCard,
  ShieldCheck,
  Clock,
  Globe,
  FlaskConical,
} from 'lucide-react'
import Badge from '../ui/Badge'

function fmtDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString()
}

function Field({ label, value, mono = false }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <span className={`text-sm text-primary ${mono ? 'font-mono break-all' : ''}`}>
        {empty ? <span className="text-muted"></span> : value}
      </span>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-pulse" />
        <h3 className="font-semibold text-primary">{title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

export default function UserOverview({ user, onApproveTrial }) {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || ''
  const addressParts = [
    user.address_line1,
    user.address_line2,
    [user.city, user.region].filter(Boolean).join(', '),
    user.postal_code,
    user.country,
  ].filter(Boolean)
  const address = addressParts.length ? addressParts.join(' · ') : ''
  const apiLimit = user.api_limit === -1 ? 'Unlimited' : user.api_limit
  const usagePct =
    user.api_limit > 0 ? Math.min(100, Math.round((user.api_used / user.api_limit) * 100)) : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-gradient-to-br from-info/15 to-pulse/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted">API usage</span>
            <FlaskConical className="h-4 w-4 text-pulse" />
          </div>
          <p className="text-2xl font-bold text-primary">
            {user.api_used ?? 0}
            <span className="text-sm font-normal text-muted"> / {apiLimit}</span>
          </p>
          {user.api_limit > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-void">
              <div className="h-full rounded-full bg-pulse/70" style={{ width: `${usagePct}%` }} />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-pulse/15 to-info/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted">Total tests</span>
            <FlaskConical className="h-4 w-4 text-pulse" />
          </div>
          <p className="text-2xl font-bold text-primary">{user.total_tests ?? ''}</p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-warn/15 to-danger/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted">Traffic events</span>
            <Globe className="h-4 w-4 text-pulse" />
          </div>
          <p className="text-2xl font-bold text-primary">{user.total_traffic_records ?? ''}</p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-info/15 to-pulse/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted">Plan</span>
            <CreditCard className="h-4 w-4 text-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="plan">{user.plan}</Badge>
            {user.is_trial_active && <Badge variant="warn">Trial</Badge>}
          </div>
        </div>
      </div>

      <Section icon={User} title="Account">
        <Field label="Full name" value={fullName} />
        <Field label="Email" value={user.email} />
        <Field label="User ID" value={user._id || user.id} mono />
        <Field
          label="Status"
          value={
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          }
        />
        <Field
          label="Role"
          value={user.is_admin ? <Badge>Admin</Badge> : 'User'}
        />
        <Field label="Plan" value={<Badge variant="plan">{user.plan}</Badge>} />
      </Section>

      <Section icon={Phone} title="Contact & address">
        <Field label="Phone" value={user.phone} />
        <Field label="Country" value={user.country} />
        <Field label="City / region" value={[user.city, user.region].filter(Boolean).join(', ')} />
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-muted">Address</span>
            <span className="flex items-start gap-1.5 text-sm text-primary">
              {address ? <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> : null}
              {address || <span className="text-muted"></span>}
            </span>
          </div>
        </div>
      </Section>

      <Section icon={CreditCard} title="Subscription & billing">
        <Field label="Trial active" value={user.is_trial_active ? 'Yes' : 'No'} />
        <Field label="Trial ends" value={fmtDate(user.trial_ends_at)} />
        <Field label="Purchase verified" value={fmtDate(user.purchase_verified_at)} />
        <Field label="Subscription renews" value={fmtDate(user.subscription_renews_at)} />
        <Field label="Freemius user ID" value={user.freemius_user_id} mono />
        <Field label="Freemius license" value={user.freemius_license_id} mono />
        <Field label="Freemius plan ID" value={user.freemius_plan_id} mono />
        <Field label="Freemius pricing ID" value={user.freemius_pricing_id} mono />
      </Section>

      <Section icon={ShieldCheck} title="Abuse Prevention & Trial Risk">
        <Field
          label="Risk Tier"
          value={
            <Badge
              variant={
                user.trial_risk_tier === 'restricted'
                  ? 'danger'
                  : user.trial_risk_tier === 'flagged'
                  ? 'warn'
                  : 'success'
              }
            >
              {user.trial_risk_tier || 'normal'}
            </Badge>
          }
        />
        <Field
          label="Risk Score"
          value={
            <span
              className={`font-bold ${
                (user.trial_risk_score || 0) >= 80
                  ? 'text-danger'
                  : (user.trial_risk_score || 0) >= 40
                  ? 'text-warn'
                  : 'text-success'
              }`}
            >
              {user.trial_risk_score ?? 0} pts
            </span>
          }
        />
        <Field label="Normalized Email" value={user.normalized_email || user.email} mono />
        <Field label="Registration IP" value={user.registration_ip} mono />
        <div className="sm:col-span-2 lg:col-span-2">
          <Field label="Device Fingerprint" value={user.device_fingerprint || 'Not captured'} mono />
        </div>
        {onApproveTrial && (user.trial_risk_tier === 'restricted' || user.trial_risk_tier === 'flagged' || !user.is_trial_active) && (
          <div className="sm:col-span-2 lg:col-span-3 pt-2">
            <button
              type="button"
              onClick={onApproveTrial}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              Approve 7-Day Pro Trial
            </button>
          </div>
        )}
      </Section>

      <Section icon={ShieldCheck} title="Security & login">
        <Field label="Registration IP" value={user.registration_ip} mono />
        <Field label="Last login IP" value={user.last_login_ip} mono />
        <Field label="Last login" value={fmtDate(user.last_login_at)} />
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Last user agent" value={user.last_user_agent} mono />
        </div>
      </Section>

      <Section icon={Clock} title="Timestamps">
        <Field label="Created" value={fmtDate(user.created_at)} />
        <Field label="Updated" value={fmtDate(user.updated_at)} />
      </Section>
    </div>
  )
}
