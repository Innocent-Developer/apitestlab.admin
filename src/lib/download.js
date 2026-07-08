import api from './api'

/**
 * Download a file from an admin API endpoint (blob response).
 */
export async function downloadAdminExport(path, params = {}) {
  const res = await api.get(path, { params, responseType: 'blob' })
  const disposition = res.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^";\n]+)"?/)
  const filename = match ? match[1] : `export.${params.format || 'csv'}`
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
