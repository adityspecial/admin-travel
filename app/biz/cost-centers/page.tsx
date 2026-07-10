'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface CostCenter { id: string; name: string; code: string; description?: string; is_active: boolean }

const INP = { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, width: '100%' }

export default function CostCentersPage() {
  const [items, setItems]     = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ name: '', code: '', description: '' })
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')

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
      await adminFetch('/api/admin/biz/cost-centers', { method: 'POST', body: JSON.stringify(form) })
      setForm({ name: '', code: '', description: '' })
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/cost-centers', { method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setItems(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this cost center?')) return
    await adminFetch('/api/admin/biz/cost-centers', { method: 'DELETE', body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(c => c.id !== id))
  }

  function badge(active: boolean) {
    return { background: active ? '#DCFCE7' : '#F3F4F6', color: active ? '#16A34A' : '#6B7280', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }
  }

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', padding: '24px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>Cost Centers</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Tag bookings to departments or projects.</p>

      {/* Add form */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>Add Cost Center</div>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Code *</label>
              <input placeholder="MKTG" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Name *</label>
              <input placeholder="Marketing" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Description</label>
              <input placeholder="Optional" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={INP} />
            </div>
            <button type="submit" disabled={saving} style={{
              padding: '10px 20px', background: '#E31E24', color: '#fff', border: 'none',
              borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' as const, alignSelf: 'flex-end',
            }}>{saving ? 'Adding…' : 'Add'}</button>
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </form>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>All Cost Centers</span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{items.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Code', 'Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No cost centers yet. Add one above.</td></tr>
              ) : items.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 13 }}>{c.code}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 13 }}>{c.name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>{c.description ?? '—'}</td>
                  <td style={{ padding: '14px 20px' }}><span style={badge(c.is_active)}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleActive(c.id, c.is_active)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #E5E7EB', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#EF4444' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
