import { LogOut } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function Topbar({ title }) {
  const { user, logout } = useAdminAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-void px-6">
      <h1 className="text-lg font-semibold text-primary">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-surface-hover hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  )
}
