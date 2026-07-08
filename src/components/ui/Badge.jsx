const PLAN_STYLES = {
  free: 'bg-muted/20 text-muted border-muted/30',
  pro: 'bg-info/15 text-info border-info/30',
  max: 'bg-pulse/15 text-pulse border-pulse/30',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-surface-hover text-primary border-border',
    success: 'bg-pulse/15 text-pulse border-pulse/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    warn: 'bg-warn/15 text-warn border-warn/30',
    plan: PLAN_STYLES[String(children).toLowerCase()] || PLAN_STYLES.free,
  }
  const key = variant === 'plan' ? 'plan' : variant
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[key] || styles.default} ${className}`}
    >
      {children}
    </span>
  )
}
