import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ toast: push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.type === 'error'
                ? 'border-danger/40 bg-danger/10 text-red-200'
                : t.type === 'success'
                  ? 'border-pulse/40 bg-pulse/10 text-pulse'
                  : 'border-border bg-surface text-primary'
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>
              <X className="h-4 w-4 opacity-60" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
