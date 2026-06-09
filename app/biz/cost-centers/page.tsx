'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface CostCenter { id: string; name: string; code: string; description?: string; is_active: boolean }

export default function CostCentersPage() {
  const [items, setItems]     = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ name: '', code: '', description: '' })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/cost-centers')
      .then(d => setItems(d.costCenters ?? []))
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await adminFetch('/api/admin/biz/cost-centers', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ name: '', code: '', description: '' })
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/cost-centers', {
      method: 'PATCH',
      body: JSON.stringify({ id, isActive: !current }),
    })
    setItems(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this cost center?')) return
    await adminFetch('/api/admin/biz/cost-centers', { method: 'DELETE', body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Cost Centers</h2>
        <span className="topbar-meta">Tag bookings to departments or projects</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Add form */}
          <div className="form-card">
            <div className="card-title" style={{ marginBottom: 16 }}>Add Cost Center</div>
            <form onSubmit={handleAdd}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 2fr auto' }}>
                <div className="form-group">
                  <label>Code *</label>
                  <input placeholder="MKTG" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input placeholder="Marketing" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input placeholder="Optional description" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label>&nbsp;</label>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
              {error && <div className="banner-success" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
            </form>
          </div>

          {/* Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="card-title">All Cost Centers</div>
              <div className="card-copy">{items.length} total</div>
            </div>
            <table>
              <thead>
                <tr><th>Code</th><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No cost centers yet. Add one above.</td></tr>
                ) : items.map(c => (
                  <tr key={c.id}>
                    <td><code>{c.code}</code></td>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{c.description ?? '--'}</td>
                    <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="page-actions">
                        <button className={`btn btn-sm ${c.is_active ? 'btn-ghost' : 'btn-muted'}`} onClick={() => toggleActive(c.id, c.is_active)}>
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
