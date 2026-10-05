import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Eye, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

import AppShell from '../components/layout/AppShell'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Badge from '../components/ui/Badge'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'
import { useToast } from '../components/ui/Toast'

const STATUS_FILTERS = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All Submissions' },
]

export default function StudentVerificationsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)

  // Document viewer modal
  const [viewingDocUrl, setViewingDocUrl] = useState(null)
  const [fetchingUrlId, setFetchingUrlId] = useState(null)

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)

  // Approval loading
  const [approvingId, setApprovingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN.STUDENT_VERIFICATIONS, {
        params: { status, page, limit: 20 },
      })
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [page, status, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleViewDocument = async (id) => {
    setFetchingUrlId(id)
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_DOC_URL(id))
      if (data.url) {
        setViewingDocUrl(data.url)
      } else {
        toast('Failed to generate document URL', 'error')
      }
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setFetchingUrlId(null)
    }
  }

  const handleApprove = async (id) => {
    setApprovingId(id)
    try {
      const { data } = await api.post(API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_APPROVE(id))
      toast(data.message || 'Student verification approved!', 'success')
      loadData()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setApprovingId(null)
    }
  }

  const handleConfirmReject = async (e) => {
    e.preventDefault()
    if (!rejectingItem || !rejectionReason.trim()) return
    setSubmittingReject(true)

    try {
      const { data } = await api.post(
        API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_REJECT(rejectingItem.id),
        { rejection_reason: rejectionReason }
      )
      toast(data.message || 'Verification rejected', 'success')
      setRejectingItem(null)
      setRejectionReason('')
      loadData()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setSubmittingReject(false)
    }
  }

  const columns = [
    {
      key: 'account_email',
      label: 'Account Email',
      render: (r) => (
        <div>
          <Link to={`/users/${r.user_id}`} className="font-semibold text-primary hover:underline">
            {r.account_email || r.user_id}
          </Link>
          <div className="text-xs text-muted">ID: {r.user_id}</div>
        </div>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (r) => (
        <Badge variant={r.method === 'email' ? 'info' : 'default'}>
          {r.method === 'email' ? 'University Email' : 'Document Photo'}
        </Badge>
      ),
    },
    {
      key: 'university_name',
      label: 'Institution & Grad Date',
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-primary">{r.university_name || r.university_email || 'N/A'}</p>
          {r.expected_graduation_date && (
            <p className="text-xs text-muted">Grad: {r.expected_graduation_date}</p>
          )}
        </div>
      ),
    },
    {
      key: 'risk_score',
      label: 'Risk Score',
      render: (r) => {
        const score = r.risk_score || 0
        const isHigh = score >= 80
        const isMed = score >= 40 && score < 80
        return (
          <span
            className={`font-semibold text-xs px-2 py-1 rounded ${
              isHigh
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : isMed
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}
          >
            {score} {isHigh ? '(High)' : isMed ? '(Medium)' : '(Low)'}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge
          variant={
            r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warn'
          }
        >
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (r) => (
        <span className="text-xs text-muted">
          {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.document_r2_key ? (
            <button
              type="button"
              onClick={() => handleViewDocument(r.id)}
              disabled={fetchingUrlId === r.id}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-surface-hover text-primary hover:bg-border transition border border-border"
            >
              {fetchingUrlId === r.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              View Photo
            </button>
          ) : (
            <span className="text-xs text-muted">Auto Verified</span>
          )}

          {r.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                disabled={approvingId === r.id}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition"
              >
                {approvingId === r.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(r)
                  setRejectionReason('')
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-500 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppShell title="Student Verification Queue">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-pulse" /> Student Plan Verifications
            </h1>
            <p className="text-xs text-muted mt-1">
              Review uploaded student ID photos stored privately in Cloudflare R2 and approve or reject applications.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="self-start flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-surface border border-border text-primary hover:bg-surface-hover transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatus(f.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                status === f.id
                  ? 'bg-pulse/20 text-pulse border border-pulse/30'
                  : 'text-muted hover:text-primary hover:bg-surface-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={items} loading={loading} />

        <Pagination
          page={page - 1}
          pageSize={20}
          total={total}
          onPageChange={(p) => setPage(p + 1)}
        />
      </div>

      {/* Document Viewer Modal */}
      {viewingDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-primary text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-pulse" /> Student ID Photo (Presigned 10-min R2 Link)
              </h3>
              <button
                type="button"
                onClick={() => setViewingDocUrl(null)}
                className="text-muted hover:text-primary text-sm font-semibold"
              >
                Close ✕
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-black/40">
              {viewingDocUrl.endsWith('.pdf') ? (
                <iframe title="Student Document PDF Viewer" src={viewingDocUrl} className="w-full h-[600px] rounded border border-border" />
              ) : (

                <img
                  src={viewingDocUrl}
                  alt="Student ID Document"
                  className="max-w-full max-h-[70vh] object-contain rounded border border-border shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-primary text-lg flex items-center gap-2 text-rose-400">
              <XCircle className="w-5 h-5" /> Reject Student Verification
            </h3>
            <p className="text-xs text-muted">
              Applicant: <span className="font-semibold text-primary">{rejectingItem.account_email}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                Rejection Reason (Required)
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Image was blurry, document unreadable, or graduation date expired."
                className="w-full p-3 bg-surface-hover border border-border rounded-lg text-sm text-primary focus:outline-none focus:border-pulse"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded bg-surface border border-border text-primary hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReject || !rejectionReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 flex items-center gap-2"
              >
                {submittingReject ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}
