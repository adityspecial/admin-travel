'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'

interface Item {
  id: string; placement: string; category: string | null
  title: string; subtitle: string; tag: string | null
  image_url: string | null; bg_color: string; icon: string
  target_from: string | null; target_to: string | null
  static_price_label: string | null; use_live_price: boolean
  pill1_label: string | null; pill2_label: string | null
  deeplink: string | null; sort_order: number
  is_active: boolean; valid_from: string | null; valid_until: string | null
}

const PLACEMENTS = [
  { value: 'home_consumer',        label: 'Home — Consumer (What\'s New banners)' },
  { value: 'home_collection',      label: 'Home — Collections' },
  { value: 'home_biz',             label: 'Home — MyBiz (mobile)' },
  { value: 'home_biz_web',         label: 'Home — MyBiz (biz-portal offers rail)' },
  { value: 'home_biz_benefits',    label: 'Home — MyBiz (biz-portal corporate benefits)' },
  { value: 'destination_suggestion', label: 'Destination Suggestions' },
  { value: 'nearby_getaway',       label: 'Nearby Getaways' },
  { value: 'popular_destination',  label: 'Popular Destinations' },
  { value: 'hotel_search',         label: 'Hotel Search Page' },
  { value: 'cab_search',           label: 'Cab Search Page' },
  { value: 'insurance_search',     label: 'Insurance Page' },
]

const BLANK = {
  placement: 'home_consumer', category: '', title: '', subtitle: '', tag: '',
  image_url: '', bg_color: '#1463F3', icon: 'airplane',
  target_from: '', target_to: '', static_price_label: '', use_live_price: false,
  pill1_label: '', pill2_label: '',
  deeplink: '', sort_order: 0, valid_from: '', valid_until: '',
}

const ICON_OPTIONS = [
  'airplane', 'bed-outline', 'notifications-outline', 'shield-checkmark-outline',
  'cash-outline', 'document-text-outline', 'gift-outline', 'star-outline',
  'umbrella-outline', 'car-outline', 'globe-outline', 'wallet-outline',
]

const COLOR_PRESETS = [
  '#1463F3', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DC2626',
  '#0D9488', '#DB2777', '#4F46E5', '#92400E',
]

export default function FeaturedContentPage() {
  const [items,    setItems]    = useState<Item[]>([])
  const [filter,   setFilter]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [msg,      setMsg]      = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState(BLANK)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/featured-content${filter ? `?placement=${filter}` : ''}`)
      .then((d: { items: Item[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  function openCreate() {
    setEditId(null)
    setForm({ ...BLANK, placement: filter || 'home_consumer' })
    setShowForm(true)
  }

  function openEdit(it: Item) {
    setEditId(it.id)
    setForm({
      placement: it.placement, category: it.category ?? '', title: it.title, subtitle: it.subtitle,
      tag: it.tag ?? '', image_url: it.image_url ?? '', bg_color: it.bg_color, icon: it.icon,
      target_from: it.target_from ?? '', target_to: it.target_to ?? '',
      static_price_label: it.static_price_label ?? '', use_live_price: it.use_live_price,
      pill1_label: it.pill1_label ?? '', pill2_label: it.pill2_label ?? '',
      deeplink: it.deeplink ?? '', sort_order: it.sort_order,
      valid_from: it.valid_from ?? '', valid_until: it.valid_until ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.placement || !form.title) { flash('Placement and Title are required.'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        category:  form.category || null,
        tag:       form.tag || null,
        image_url: form.image_url || null,
        target_from: form.target_from || null,
        target_to:   form.target_to || null,
        static_price_label: form.static_price_label || null,
        pill1_label: form.pill1_label || null,
        pill2_label: form.pill2_label || null,
        deeplink:    form.deeplink || null,
        valid_from:  form.valid_from || null,
        valid_until: form.valid_until || null,
        sort_order:  Number(form.sort_order),
      }
      if (editId) {
        await adminFetch(`/api/admin/super/featured-content/${editId}`, { method: 'PATCH', body: JSON.stringify(body) })
        flash('Updated.')
      } else {
        await adminFetch('/api/admin/super/featured-content', { method: 'POST', body: JSON.stringify(body) })
        flash('Created.')
      }
      setShowForm(false); setEditId(null); load()
    } catch (e: any) { flash('Error: ' + (e.message ?? 'Failed')) }
    finally { setSaving(false) }
  }

  async function toggleActive(it: Item) {
    await adminFetch(`/api/admin/super/featured-content/${it.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !it.is_active }) })
    load()
  }

  async function del(it: Item) {
    if (!confirm(`Delete "${it.title}"?`)) return
    await adminFetch(`/api/admin/super/featured-content/${it.id}`, { method: 'DELETE' })
    flash('Deleted.'); load()
  }

  function f(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm(p => ({ ...p, [key]: v }))
    }
  }

  const placementLabel = (v: string) => PLACEMENTS.find(p => p.value === v)?.label ?? v

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif", maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Featured Content</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>
            Every promotional card shown anywhere in the app — home screens, search pages, destination suggestions · {items.length} items
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, fontWeight: 600, color: msg.startsWith('Error') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
          <button onClick={openCreate} style={btn('#2563EB')}>+ New Item</button>
        </div>
      </div>

      {/* Placement filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setFilter('')} style={tabBtn(filter === '')}>All</button>
        {PLACEMENTS.map(p => (
          <button key={p.value} onClick={() => setFilter(p.value)} style={tabBtn(filter === p.value)}>{p.label}</button>
        ))}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>{editId ? 'Edit Item' : 'New Item'}</h3>

          {/* Live preview */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Preview</div>
            <div style={{ width: 340, height: 110, borderRadius: 16, backgroundColor: form.bg_color, padding: '14px 18px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', right: -20, top: -30 }} />
              <div>
                {form.tag && <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{form.tag}</div>}
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{form.title || 'Title'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                  {form.use_live_price ? 'Live price from calendar fare' : form.static_price_label || form.subtitle || 'Subtitle text'}
                </div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✈</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Placement *</label>
              <select value={form.placement} onChange={f('placement')} style={inp()}>
                {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Category (optional sub-tab)</label>
              <input value={form.category} onChange={f('category')} placeholder="e.g. flight, hotels" style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Title *</label>
              <input value={form.title} onChange={f('title')} placeholder="e.g. Goa Getaway" style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Subtitle</label>
              <input value={form.subtitle} onChange={f('subtitle')} placeholder="e.g. Beaches & nightlife" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Tag / Badge</label>
              <input value={form.tag} onChange={f('tag')} placeholder="e.g. Trending" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Sort Order</label>
              <input type="number" value={form.sort_order} onChange={f('sort_order')} style={inp()} />
            </div>

            <div>
              <label style={lbl}>Route/Target From (IATA code, city_id, or location)</label>
              <input value={form.target_from} onChange={f('target_from')} placeholder="e.g. DEL" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Route/Target To</label>
              <input value={form.target_to} onChange={f('target_to')} placeholder="e.g. BOM" style={inp()} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
              <input type="checkbox" checked={form.use_live_price} onChange={f('use_live_price')} id="ulp" />
              <label htmlFor="ulp" style={{ fontSize: 13, color: '#374151' }}>Use live lowest fare (calendar-fare) instead of a static price label</label>
            </div>
            {!form.use_live_price && (
              <div>
                <label style={lbl}>Static Price Label</label>
                <input value={form.static_price_label} onChange={f('static_price_label')} placeholder="e.g. from ₹2,400" style={inp()} />
              </div>
            )}

            <div>
              <label style={lbl}>Pill 1 Label (optional sub-badge, e.g. "Lower Fares")</label>
              <input value={form.pill1_label} onChange={f('pill1_label')} placeholder="e.g. Lower Fares" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Pill 2 Label (optional sub-badge, e.g. "Flexible Changes")</label>
              <input value={form.pill2_label} onChange={f('pill2_label')} placeholder="e.g. Flexible Changes" style={inp()} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Deeplink (in-app route or https://…)</label>
              <input value={form.deeplink} onChange={f('deeplink')} placeholder="e.g. /(app)/flights/search?from=DEL&to=BOM" style={inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Image URL (overrides solid color)</label>
              <input value={form.image_url} onChange={f('image_url')} placeholder="https://…" style={inp()} />
              {form.image_url && <img src={form.image_url} alt="preview" style={{ marginTop: 8, width: '100%', maxWidth: 340, height: 80, objectFit: 'cover', borderRadius: 10 }} />}
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
                <input type="color" value={form.bg_color} onChange={f('bg_color')} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E5E7EB', cursor: 'pointer', padding: 1 }} />
              </div>
            </div>
            <div>
              <label style={lbl}>Valid From (optional)</label>
              <input type="date" value={form.valid_from} onChange={f('valid_from')} style={inp()} />
            </div>
            <div>
              <label style={lbl}>Valid Until (optional)</label>
              <input type="date" value={form.valid_until} onChange={f('valid_until')} style={inp()} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={btn('#6B7280')}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ ...btn('#2563EB'), opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>
          No items{filter ? ` for ${placementLabel(filter)}` : ''} yet. Click <strong>+ New Item</strong> to create one.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['#', 'Placement', 'Title', 'Route/Target', 'Price', 'Dates', 'Active', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12 }}>{it.sort_order}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', borderRadius: 6, padding: '3px 8px' }}>{placementLabel(it.placement)}</span>
                    {it.category && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{it.category}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                    <div style={{ fontWeight: 600, color: '#111' }}>{it.title}</div>
                    <div style={{ color: '#6B7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.subtitle}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    {it.target_from ? `${it.target_from}${it.target_to ? ` → ${it.target_to}` : ''}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    {it.use_live_price ? <span style={{ color: '#059669', fontWeight: 600 }}>Live</span> : (it.static_price_label || '—')}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {it.valid_from ?? '∞'} → {it.valid_until ?? '∞'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => toggleActive(it)} style={toggleBtn(it.is_active)}>{it.is_active ? 'Active' : 'Draft'}</button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(it)} style={btn('#2563EB', true)}>Edit</button>
                      <button onClick={() => del(it)} style={btn('#dc2626', true)}>Del</button>
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
function tabBtn(active: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    border: `1.5px solid ${active ? '#2563EB' : '#E5E7EB'}`,
    background: active ? '#EFF6FF' : '#fff', color: active ? '#2563EB' : '#6B7280',
  }
}
