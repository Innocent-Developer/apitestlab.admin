import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ title, children }) {
  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
