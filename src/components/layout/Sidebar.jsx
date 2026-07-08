import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Activity,
  CreditCard,
  BarChart3,
  Mail,
  Shield,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/emails', icon: Mail, label: 'Emails' },
]

export default function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-5">
        <Shield className="h-6 w-6 text-pulse" />
        <div>
          <p className="text-sm font-semibold text-primary">API Test Lab</p>
          <p className="text-[10px] text-muted">Admin Panel</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-pulse/10 text-pulse'
                  : 'text-muted hover:bg-surface-hover hover:text-primary'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
