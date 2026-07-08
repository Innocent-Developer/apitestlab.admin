import Modal from './Modal'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            danger ? 'bg-danger hover:bg-danger/90' : 'bg-info hover:bg-info/90'
          }`}
        >
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
