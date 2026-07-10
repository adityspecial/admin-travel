'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import { VisaEditModal } from './VisaEditModal'

interface VisaSummary {
  id: string; slug: string; country: string; page_title: string
  hero_image_url: string | null; processing_time: string | null
  visa_fee_display: string | null; is_active: boolean; sort_order: number; created_at: string
}

const PAGE_SIZE = 20

export default function SuperVisaPage() {
  const [visas,   setVisas]   = useState<VisaSummary[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [editId,  setEditId]  = useState<string | null>(null)
  const [msg,     setMsg]     = useState('')

  // New visa form state
  const [showCreate, setShowCreate] = useState(false)
  const [newCountry, setNewCountry] = useState('')
  const [newTitle,   setNewTitle]   = useState('')
  const [creating,   setCreating]   = useState(false)

  const load = useCallback((q: string, p: number) => {
    setLoading(true)
    adminFetch(`/api/admin/super/visa?search=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}`)
      .then((d: { visas: VisaSummary[]; total: number }) => {
        setVisas(d.visas ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(search, page) }, [page])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); setPage(1); load(search, 1)
  }

  async function toggleActive(v: VisaSummary) {
    await adminFetch(`/api/admin/super/visa/${v.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !v.is_active }),
    })
    load(search, page)
  }

  async function handleDelete(v: VisaSummary) {
    if (!confirm(`Delete "${v.page_title}"? This cannot be undone.`)) return
    await adminFetch(`/api/admin/super/visa/${v.id}`, { method: 'DELETE' })
    flash('Deleted.')
    load(search, page)
  }

  async function createVisa() {
    if (!newCountry || !newTitle) return
    setCreating(true)
    try {
      const { visa } = await adminFetch('/api/admin/super/visa', {
        method: 'POST',
        body: JSON.stringify({ country: newCountry, page_title: newTitle }),
      })
      setShowCreate(false); setNewCountry(''); setNewTitle('')
      load(search, page)
      setEditId(visa.id)
    } catch (e: any) { flash('Error: ' + (e.message ?? 'Failed')) }
    finally { setCreating(false) }
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ padding:28, fontFamily:"'Inter', sans-serif" }}>

      <div style={{ marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0, color:'#111' }}>Visa Pages</h1>
          <p style={{ color:'#6B7280', fontSize:13, margin:'4px 0 0' }}>{total} visa pages in database</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {msg && <span style={{ fontSize:13, color: msg.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight:600 }}>{msg}</span>}
          <a href="/super/visa/enquiries" style={{ ...btn('#0891B2'), textDecoration: 'none', display: 'inline-block' }}>Enquiries</a>
          <button onClick={() => setShowCreate(true)} style={btn('#2563EB')}>+ New Visa Page</button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:380, boxShadow:'0 16px 40px rgba(0,0,0,0.16)' }}>
            <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700 }}>New Visa Page</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={lbl}>Country</label>
                <input value={newCountry} onChange={e => setNewCountry(e.target.value)} placeholder="e.g. Dubai" style={inp()} />
              </div>
              <div>
                <label style={lbl}>Page Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Dubai Visa" style={inp()} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={btn('#6B7280')}>Cancel</button>
              <button onClick={createVisa} disabled={creating || !newCountry || !newTitle} style={{ ...btn('#2563EB'), opacity: (creating||!newCountry||!newTitle) ? 0.6 : 1 }}>
                {creating ? 'Creating…' : 'Create & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by country, title, slug…"
          style={{ flex:1, padding:'8px 14px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:14, outline:'none' }} />
        <button type="submit" style={btn('#2563EB')}>Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); setPage(1); load('', 1) }} style={btn('#6B7280')}>Clear</button>}
      </form>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#6B7280' }}>Loading…</div>
      ) : visas.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#9CA3AF', fontSize:14 }}>
          No visa pages yet. Click <strong>+ New Visa Page</strong> to create one.
        </div>
      ) : (
        <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #E5E7EB' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ backgroundColor:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                {['Flag/Image', 'Country', 'Page Title', 'Slug', 'Processing', 'Fee', 'Active', 'Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'#374151', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visas.map((v, i) => (
                <tr key={v.id} style={{ borderBottom:'1px solid #F3F4F6', backgroundColor: i%2===0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding:'8px 14px' }}>
                    {v.hero_image_url ? (
                      <img src={v.hero_image_url} alt="" style={{ width:56, height:40, objectFit:'cover', borderRadius:6 }} />
                    ) : (
                      <div style={{ width:56, height:40, borderRadius:6, background:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🌍</div>
                    )}
                  </td>
                  <td style={{ padding:'8px 14px', fontWeight:600, color:'#111' }}>{v.country}</td>
                  <td style={{ padding:'8px 14px', color:'#374151', maxWidth:200 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.page_title}</div>
                  </td>
                  <td style={{ padding:'8px 14px', color:'#6B7280', fontSize:12, fontFamily:'monospace' }}>{v.slug}</td>
                  <td style={{ padding:'8px 14px', color:'#374151', whiteSpace:'nowrap' }}>{v.processing_time ?? '—'}</td>
                  <td style={{ padding:'8px 14px', fontWeight:600, color:'#111', whiteSpace:'nowrap' }}>{v.visa_fee_display ?? '—'}</td>
                  <td style={{ padding:'8px 14px' }}>
                    <button onClick={() => toggleActive(v)} style={toggleBtn(v.is_active, '#16a34a')}>
                      {v.is_active ? 'Active' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ padding:'8px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setEditId(v.id)} style={btn('#2563EB', true)}>Edit</button>
                      <button onClick={() => handleDelete(v)} style={btn('#dc2626', true)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display:'flex', gap:8, marginTop:16, alignItems:'center', justifyContent:'center' }}>
          <button disabled={page<=1} onClick={() => setPage(p => p-1)} style={btn('#6B7280', true)}>← Prev</button>
          <span style={{ fontSize:13, color:'#374151' }}>Page {page} of {totalPages}</span>
          <button disabled={page>=totalPages} onClick={() => setPage(p => p+1)} style={btn('#2563EB', true)}>Next →</button>
        </div>
      )}

      {editId && (
        <VisaEditModal
          visaId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { flash('Saved!'); load(search, page) }}
        />
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }
const inp = (): React.CSSProperties => ({
  width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:8,
  fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit',
})
function btn(color: string, small = false): React.CSSProperties {
  return { background:color, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', padding: small ? '6px 12px' : '8px 16px', fontSize: small ? 12 : 14, fontWeight:600 }
}
function toggleBtn(active: boolean, activeColor: string): React.CSSProperties {
  return {
    background: active ? activeColor+'20' : '#F3F4F6',
    color: active ? activeColor : '#6B7280',
    border: `1px solid ${active ? activeColor+'50' : '#E5E7EB'}`,
    borderRadius:20, cursor:'pointer', padding:'3px 10px', fontSize:11, fontWeight:600,
  }
}
