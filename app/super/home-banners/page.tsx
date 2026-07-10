'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'

interface Banner {
  id: string; bg_color: string; icon: string; tag: string; title: string
  sub: string; action_url: string | null; image_url: string | null; sort_order: number
  is_active: boolean; valid_from: string | null; valid_until: string | null
}

const BLANK = { bg_color: '#1463F3', icon: 'airplane', tag: '', title: '', sub: '', action_url: '', image_url: '', sort_order: 0, valid_from: '', valid_until: '' }

const ICON_OPTIONS = [
  'airplane', 'bed-outline', 'notifications-outline', 'shield-checkmark-outline',
  'cash-outline', 'document-text-outline', 'gift-outline', 'star-outline',
  'umbrella-outline', 'car-outline', 'globe-outline', 'wallet-outline',
]

const COLOR_PRESETS = [
  '#1463F3', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DC2626',
  '#0D9488', '#DB2777', '#4F46E5', '#92400E',
]

export default function HomeBannersPage() {
  const [banners,  setBanners]  = useState<Banner[]>([])
  const [loading,  setLoading]  = useState(true)
  const [msg,      setMsg]      = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState(BLANK)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch('/api/admin/super/home-banners')
      .then((d: { banners: Banner[] }) => setBanners(d.banners ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  function openCreate() {
    setEditId(null)
    setForm(BLANK)
    setShowForm(true)
  }

  function openEdit(b: Banner) {
    setEditId(b.id)
    setForm({
      bg_color: b.bg_color, icon: b.icon, tag: b.tag, title: b.title,
      sub: b.sub, action_url: b.action_url ?? '', image_url: b.image_url ?? '',
      sort_order: b.sort_order, valid_from: b.valid_from ?? '', valid_until: b.valid_until ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.tag || !form.title) { flash('Tag and Title are required.'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        action_url: form.action_url || null,
        image_url:  form.image_url  || null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        sort_order: Number(form.sort_order),
      }
      if (editId) {
        await adminFetch(`/api/admin/super/home-banners/${editId}`, { method: 'PATCH', body: JSON.stringify(body) })
        flash('Banner updated.')
      } else {
        await adminFetch('/api/admin/super/home-banners', { method: 'POST', body: JSON.stringify(body) })
        flash('Banner created.')
      }
      setShowForm(false); setEditId(null); load()
    } catch (e: any) { flash('Error: ' + (e.message ?? 'Failed')) }
    finally { setSaving(false) }
  }

  async function toggleActive(b: Banner) {
    await adminFetch(`/api/admin/super/home-banners/${b.id}`, {
      method: 'PATCH', body: JSON.stringify({ is_active: !b.is_active }),
    })
    load()
  }

  async function del(b: Banner) {
    if (!confirm(`Delete "${b.title}"?`)) return
    await adminFetch(`/api/admin/super/home-banners/${b.id}`, { method: 'DELETE' })
    flash('Deleted.'); load()
  }

  function f(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>What's New Banners</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>
            Manage the carousel banners on the consumer home screen · {banners.length} banners
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, fontWeight: 600, color: msg.startsWith('Error') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
          <button onClick={openCreate} style={btn('#2563EB')}>+ New Banner</button>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>{editId ? 'Edit Banner' : 'New Banner'}</h3>

          {/* Live preview */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Preview</div>
            <div style={{ width: 340, height: 110, borderRadius: 16, backgroundColor: form.bg_color, padding: '14px 18px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', right: -20, top: -30 }} />
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{form.tag || 'Tag'}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{form.title || 'Banner Title'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{form.sub || 'Subtitle text'}</div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                ✈
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Tag *</label>
              <input value={form.tag} onChange={f('tag')} placeholder="e.g. New Route" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Sort Order</label>
              <input type="number" value={form.sort_order} onChange={f('sort_order')} style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Title * (use \n for line break)</label>
              <input value={form.title} onChange={f('title')} placeholder="e.g. Direct Flights\nto Bali Now Live" style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Subtitle</label>
              <input value={form.sub} onChange={f('sub')} placeholder="e.g. No stopovers · From ₹18,990" style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Action URL (in-app route or https://…)</label>
              <input value={form.action_url ?? ''} onChange={f('action_url')} placeholder="e.g. /(app)/visa or https://..." style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Background Image URL (Unsplash or any https://… — overrides solid color)</label>
              <input value={form.image_url ?? ''} onChange={f('image_url')} placeholder="https://images.unsplash.com/photo-..." style={inp()} />
              {form.image_url && (
                <img src={form.image_url} alt="preview" style={{ marginTop: 8, width: '100%', maxWidth: 340, height: 80, objectFit: 'cover', borderRadius: 10 }} />
              )}
            </div>
            <div>
              <label style={lbl}>Icon</label>
              <select value={form.icon} onChange={f('icon')} style={inp()}>
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Background Color</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {COLOR_PRESETS.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, bg_color: c }))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: c, border: form.bg_color === c ? '3px solid #111' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
                <input type="color" value={form.bg_color} onChange={f('bg_color')}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E5E7EB', cursor: 'pointer', padding: 1 }} />
              </div>
            </div>
            <div>
              <label style={lbl}>Valid From (optional)</label>
              <input type="date" value={form.valid_from ?? ''} onChange={f('valid_from')} style={inp()} />
            </div>
            <div>
              <label style={lbl}>Valid Until (optional)</label>
              <input type="date" value={form.valid_until ?? ''} onChange={f('valid_until')} style={inp()} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={btn('#6B7280')}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ ...btn('#2563EB'), opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : editId ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Loading…</div>
      ) : banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>
          No banners yet. Click <strong>+ New Banner</strong> to create one.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['#', 'Preview', 'Tag', 'Title', 'Subtitle', 'Action URL', 'Dates', 'Active', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banners.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12 }}>{b.sort_order}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: 80, height: 44, borderRadius: 8, background: b.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '0 6px', lineHeight: 1.2 }}>
                        {b.tag}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111' }}>{b.tag}</td>
                  <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                    <div style={{ whiteSpace: 'pre-line', color: '#374151', lineHeight: 1.4 }}>{b.title}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6B7280', maxWidth: 160 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.sub || '—'}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#2563EB', fontFamily: 'monospace', fontSize: 11 }}>
                    {b.action_url ? <span style={{ display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.action_url}</span> : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {b.valid_from ? `${b.valid_from}` : '∞'} → {b.valid_until ?? '∞'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => toggleActive(b)} style={toggleBtn(b.is_active)}>
                      {b.is_active ? 'Active' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(b)} style={btn('#2563EB', true)}>Edit</button>
                      <button onClick={() => del(b)} style={btn('#dc2626', true)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }
const inp = (): React.CSSProperties => ({
  width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
})
function btn(color: string, small = false): React.CSSProperties {
  return { background: color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', padding: small ? '5px 10px' : '8px 18px', fontSize: small ? 12 : 14, fontWeight: 600 }
}
function toggleBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? '#f0fdf4' : '#F3F4F6', color: active ? '#16a34a' : '#6B7280',
    border: `1px solid ${active ? '#86efac' : '#E5E7EB'}`, borderRadius: 20,
    cursor: 'pointer', padding: '3px 10px', fontSize: 11, fontWeight: 600,
  }
}
