export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface-hover"
        >
          Prev
        </button>
        <span className="px-2 py-1 text-primary">
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface-hover"
        >
          Next
        </button>
      </div>
    </div>
  )
}
