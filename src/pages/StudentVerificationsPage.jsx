import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  FileText,
  Save,
  Trash2,
} from 'lucide-react'

import AppShell from '../components/layout/AppShell'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Badge from '../components/ui/Badge'
import api, { getApiErrorDetail } from '../lib/api'
import { API_ENDPOINTS } from '../lib/constants'
import { useToast } from '../components/ui/Toast'

const STATUS_FILTERS = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'more_info_requested', label: 'More Info Requested' },
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

  // Application detail modal
  const [detailItem, setDetailItem] = useState(null)
  const [fetchingDetailId, setFetchingDetailId] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)

  // Request More Info modal
  const [moreInfoItem, setMoreInfoItem] = useState(null)
  const [moreInfoReason, setMoreInfoReason] = useState('')
  const [submittingMoreInfo, setSubmittingMoreInfo] = useState(false)

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // Action loading states
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

  const handleOpenDetail = async (id) => {
    setFetchingDetailId(id)
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_DETAIL(id))
      setDetailItem(data)
      setAdminNotes(data.admin_notes || '')
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setFetchingDetailId(null)
    }
  }

  const handleSaveNotes = async () => {
    if (!detailItem) return
    setSavingNotes(true)
    try {
      await api.post(API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_NOTES(detailItem.id), {
        notes: adminNotes,
      })
      toast('Admin notes saved', 'success')
      setDetailItem((prev) => (prev ? { ...prev, admin_notes: adminNotes } : null))
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleApprove = async (id) => {
    setApprovingId(id)
    try {
      const { data } = await api.post(API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_APPROVE(id))
      toast(data.message || 'Student application approved!', 'success')
      if (detailItem?.id === id) setDetailItem(null)
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
      toast(data.message || 'Application rejected', 'success')
      setRejectingItem(null)
      setRejectionReason('')
      if (detailItem?.id === rejectingItem.id) setDetailItem(null)
      loadData()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setSubmittingReject(false)
    }
  }

  const handleConfirmMoreInfo = async (e) => {
    e.preventDefault()
    if (!moreInfoItem || !moreInfoReason.trim()) return
    setSubmittingMoreInfo(true)

    try {
      const { data } = await api.post(
        API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_MORE_INFO(moreInfoItem.id),
        { reason: moreInfoReason }
      )
      toast(data.message || 'Requested additional information from applicant', 'success')
      setMoreInfoItem(null)
      setMoreInfoReason('')
      if (detailItem?.id === moreInfoItem.id) setDetailItem(null)
      loadData()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setSubmittingMoreInfo(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setSubmittingDelete(true)

    try {
      const { data } = await api.delete(
        API_ENDPOINTS.ADMIN.STUDENT_VERIFICATION_DELETE(deletingItem.id)
      )
      toast(data.message || 'Student application and proof documents deleted successfully', 'success')
      setDeletingItem(null)
      if (detailItem?.id === deletingItem.id) setDetailItem(null)
      loadData()
    } catch (err) {
      toast(getApiErrorDetail(err), 'error')
    } finally {
      setSubmittingDelete(false)
    }
  }

  const columns = [
    {
      key: 'account_email',
      label: 'Applicant & Account',
      render: (r) => (
        <div>
          <Link to={`/users/${r?.user_id}`} className="font-semibold text-primary hover:underline">
            {r?.account_email || r?.user_id || 'N/A'}
          </Link>
          <div className="text-xs text-muted">
            Created: {r?.account_created_at ? new Date(r.account_created_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'university_name',
      label: 'Institution & Grad',
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-primary">{r?.university_name || 'N/A'}</p>
          {r?.expected_graduation_date && (
            <p className="text-xs text-muted">Grad: {r.expected_graduation_date}</p>
          )}
        </div>
      ),
    },
    {
      key: 'email_verification',
      label: 'Email Signal',
      render: (r) => {
        const isOtpVerified = r?.email_verification?.otp_verified
        return (
          <Badge variant={isOtpVerified ? 'info' : 'default'}>
            {isOtpVerified ? '✓ OTP Verified' : 'No Email OTP'}
          </Badge>
        )
      },
    },
    {
      key: 'risk_score',
      label: 'Abuse Risk',
      render: (r) => {
        const score = r?.risk_score || 0
        const isDup = r?.duplicate_document_flag
        const isHigh = score >= 80 || isDup
        const isMed = score >= 40 && score < 80

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded ${
                isHigh
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : isMed
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {isDup && <AlertTriangle className="w-3 h-3 text-rose-400" />}
              {score} {isHigh ? '(High)' : isMed ? '(Med)' : '(Low)'}
            </span>
            {isDup && (
              <p className="text-[10px] text-rose-400 font-medium">
                ⚠ Reused ID Photo!
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const st = r?.status || 'pending'
        const variant =
          st === 'approved'
            ? 'success'
            : st === 'rejected'
            ? 'danger'
            : st === 'more_info_requested'
            ? 'info'
            : 'warn'
        return <Badge variant={variant}>{st.replace('_', ' ').toUpperCase()}</Badge>
      },
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (r) => (
        <span className="text-xs text-muted">
          {r?.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenDetail(r.id)}
            disabled={fetchingDetailId === r.id}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-surface-hover text-primary hover:bg-border transition border border-border"
          >
            {fetchingDetailId === r.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Review Application
          </button>

          {r?.status === 'pending' && (
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

          <button
            type="button"
            onClick={() => setDeletingItem(r)}
            title="Delete Application"
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded bg-rose-950/70 text-rose-300 hover:bg-rose-900 border border-rose-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
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
              <GraduationCap className="h-6 w-6 text-pulse" /> Student Plan Verification Queue
            </h1>
            <p className="text-xs text-muted mt-1">
              Strict Admin Approval Queue: Review uploaded student proof documents (stored in Cloudflare R2), check surfaced abuse signals & image duplicate hashes, and approve/reject applications.
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
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
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
                  ? 'bg-pulse/20 text-pulse border border-pulse/30 font-semibold'
                  : 'text-muted hover:text-primary hover:bg-surface-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Data Table Card Container */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-pulse" /> Loading student verification requests...
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={items} emptyMessage="No student verification applications found." />
              <Pagination
                page={page - 1}
                pageSize={20}
                total={total}
                onPageChange={(p) => setPage(p + 1)}
              />
            </>
          )}
        </div>
      </div>

      {/* Application Detail & Document Review Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-void/50">
              <div>
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-pulse" /> Application Review — {detailItem.account_email}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Submitted: {detailItem.submitted_at ? new Date(detailItem.submitted_at).toLocaleString() : 'N/A'} | Status: <span className="font-semibold uppercase text-pulse">{detailItem.status}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-muted hover:text-primary text-sm font-semibold px-2 py-1 rounded bg-surface hover:bg-surface-hover"
              >
                Close ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Surfaced Abuse Risk Banner */}
              {detailItem.duplicate_document_flag && (
                <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-rose-300 text-sm">⚠ REUSED DOCUMENT DETECTED</h5>
                    <p className="mt-1">
                      Perceptual image hash matched an ID document previously submitted on account: <strong className="underline">{detailItem.duplicate_match_account}</strong> within the last 90 days.
                    </p>
                  </div>
                </div>
              )}

              {/* Applicant Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-void border border-border space-y-1">
                  <span className="text-muted uppercase font-semibold text-[10px]">Institution</span>
                  <p className="font-bold text-primary text-sm">{detailItem.university_name || 'N/A'}</p>
                  <p className="text-muted">Graduation: {detailItem.expected_graduation_date || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-lg bg-void border border-border space-y-1">
                  <span className="text-muted uppercase font-semibold text-[10px]">University Email Signal</span>
                  <p className="font-bold text-primary text-sm">
                    {detailItem.email_verification?.email || 'None Provided'}
                  </p>
                  <p className={detailItem.email_verification?.otp_verified ? 'text-emerald-400 font-semibold' : 'text-muted'}>
                    {detailItem.email_verification?.otp_verified ? '✓ OTP Verified' : 'No Email OTP'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-void border border-border space-y-1">
                  <span className="text-muted uppercase font-semibold text-[10px]">Risk Score & Signals</span>
                  <p className="font-bold text-primary text-sm">Score: {detailItem.risk_score || 0}</p>
                  <div className="text-[#94A3B8] space-y-0.5">
                    {(detailItem.risk_reasons || []).map((r, i) => (
                      <p key={i}>• {r}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Document Review Viewers */}
              <div>
                <h4 className="font-bold text-primary text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pulse" /> Submitted Document Proofs (Presigned 10-min R2 Links)
                </h4>

                <div className="space-y-4">
                  {(detailItem.proof_documents || []).map((pdoc, idx) => (
                    <div key={idx} className="border border-border rounded-xl bg-void overflow-hidden">
                      <div className="px-4 py-2 bg-surface border-b border-border flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">
                          Doc #{idx + 1}: {pdoc.type?.replace('_', ' ').toUpperCase()} ({pdoc.filename})
                        </span>
                        {pdoc.presigned_url && (
                          <a
                            href={pdoc.presigned_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pulse hover:underline text-xs"
                          >
                            Open in New Tab ↗
                          </a>
                        )}
                      </div>
                      <div className="p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
                        {pdoc.presigned_url ? (
                          pdoc.content_type === 'application/pdf' || pdoc.filename?.endsWith('.pdf') ? (
                            <iframe
                              title={`PDF Viewer ${idx}`}
                              src={pdoc.presigned_url}
                              className="w-full h-[500px] rounded border border-border"
                            />
                          ) : (
                            <img
                              src={pdoc.presigned_url}
                              alt={`Document ${idx + 1}`}
                              className="max-w-full max-h-[60vh] object-contain rounded border border-border shadow-lg"
                            />
                          )
                        ) : (
                          <p className="text-muted text-xs">No presigned URL available for this file.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Admin Reviewer Notes */}
              <div className="p-4 rounded-xl bg-void border border-border space-y-3">
                <label className="block text-xs font-semibold text-muted uppercase flex items-center justify-between">
                  <span>Internal Admin Reviewer Notes (Visible to Admins Only)</span>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1 text-[11px] font-semibold text-pulse hover:underline disabled:opacity-50"
                  >
                    {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Notes
                  </button>
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. ID photo clear, matched university database, approved for 90 days."
                  className="w-full p-3 bg-surface border border-border rounded-lg text-xs text-primary focus:outline-none focus:border-pulse"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-border bg-void/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(detailItem)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Application
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreInfoItem(detailItem)
                    setMoreInfoReason('')
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded bg-info/20 text-info border border-info/30 hover:bg-info/30 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Request More Info
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingItem(detailItem)
                    setRejectionReason('')
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Application
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleApprove(detailItem.id)}
                disabled={approvingId === detailItem.id}
                className="flex items-center gap-1 px-5 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 shadow-md"
              >
                {approvingId === detailItem.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve Student Plan (90 Days Pro)
              </button>
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
              <XCircle className="w-5 h-5" /> Reject Student Application
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
                placeholder="e.g. Image was unreadable, document expired, or name mismatched."
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

      {/* Request More Info Modal */}
      {moreInfoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleConfirmMoreInfo}
            className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-primary text-lg flex items-center gap-2 text-info">
              <HelpCircle className="w-5 h-5" /> Request Additional Information
            </h3>
            <p className="text-xs text-muted">
              Applicant: <span className="font-semibold text-primary">{moreInfoItem.account_email}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                Specify Needed Document / Information (Required)
              </label>
              <textarea
                required
                rows={3}
                value={moreInfoReason}
                onChange={(e) => setMoreInfoReason(e.target.value)}
                placeholder="e.g. Please upload a clearer photo of your Student ID card showing the current academic year."
                className="w-full p-3 bg-surface-hover border border-border rounded-lg text-sm text-primary focus:outline-none focus:border-pulse"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMoreInfoItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded bg-surface border border-border text-primary hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingMoreInfo || !moreInfoReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded bg-info hover:bg-info/90 text-white disabled:opacity-50 flex items-center gap-2"
              >
                {submittingMoreInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Verification Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-primary text-lg flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" /> Delete Student Application
            </h3>
            <p className="text-xs text-muted">
              Applicant: <span className="font-semibold text-primary">{deletingItem.account_email || deletingItem.user_id}</span>
            </p>

            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-1">
              <p className="font-semibold text-rose-300">⚠ Warning: Permanent Deletion</p>
              <p>
                This action will permanently delete the verification application record and purge all associated uploaded proof documents from storage (Cloudflare R2 / local VPS).
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={submittingDelete}
                className="px-4 py-2 text-xs font-semibold rounded bg-surface border border-border text-primary hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
                className="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 flex items-center gap-2"
              >
                {submittingDelete ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
                {submittingDelete ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
