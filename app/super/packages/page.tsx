'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import { PackageEditModal } from './PackageEditModal'

interface Package {
  id: string; name: string; destination: string
  duration_nights: number; duration_days: number
  base_price: number; operator: string | null
  rating: number | null; is_featured: boolean; is_active: boolean
  thumbnail_url: string | null; created_at: string
}

const PAGE_SIZE = 20

export default function SuperPackagesPage() {
  const [packages, setPackages]   = useState<Package[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [editId, setEditId]       = useState<string | null>(null)
  const [msg, setMsg]             = useState('')

  const load = useCallback((q: string, p: number) => {
    setLoading(true)
    adminFetch(`/api/admin/super/packages?search=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}`)
      .then((d: { packages: Package[]; total: number }) => {
        setPackages(d.packages ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(search, page) }, [page])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  async function toggleActive(pkg: Package) {
    await adminFetch(`/api/admin/super/packages/${pkg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !pkg.is_active }),
    })
    load(search, page)
  }

  async function toggleFeatured(pkg: Package) {
    await adminFetch(`/api/admin/super/packages/${pkg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: !pkg.is_featured }),
    })
    load(search, page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111' }}>Holiday Packages</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>{total} packages in database</p>
        </div>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{msg}</span>}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, destination, operator…"
          style={{ flex: 1, padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <button type="submit" style={btnStyle('#2563EB')}>Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setPage(1); load('', 1) }}
            style={btnStyle('#6B7280')}>Clear</button>
        )}
      </form>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading…</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Image', 'Package', 'Destination', 'Duration', 'Price', 'Operator', 'Featured', 'Active', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, i) => (
                <tr key={pkg.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '8px 14px' }}>
                    {pkg.thumbnail_url ? (
                      <img src={pkg.thumbnail_url} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 56, height: 40, borderRadius: 6, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9CA3AF' }}>No img</div>
                    )}
                  </td>
                  <td style={{ padding: '8px 14px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 600, color: '#111', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkg.name}</div>
                    {pkg.rating && <span style={{ fontSize: 11, color: '#f59e0b' }}>★ {pkg.rating.toFixed(1)}</span>}
                  </td>
                  <td style={{ padding: '8px 14px', color: '#374151' }}>{pkg.destination}</td>
                  <td style={{ padding: '8px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{pkg.duration_nights}N {pkg.duration_days}D</td>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#111', whiteSpace: 'nowrap' }}>₹{pkg.base_price.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px 14px', color: '#6B7280' }}>{pkg.operator ?? '—'}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <button onClick={() => toggleFeatured(pkg)} style={toggleBtnStyle(pkg.is_featured, '#f59e0b')}>
                      {pkg.is_featured ? '★ Featured' : '☆ Feature'}
                    </button>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <button onClick={() => toggleActive(pkg)} style={toggleBtnStyle(pkg.is_active, '#16a34a')}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <button onClick={() => setEditId(pkg.id)} style={btnStyle('#2563EB', true)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={btnStyle('#6B7280', true)}>← Prev</button>
          <span style={{ fontSize: 13, color: '#374151' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={btnStyle('#2563EB', true)}>Next →</button>
        </div>
      )}

      {editId && (
        <PackageEditModal
          pkgId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { setMsg('Saved!'); load(search, page); setTimeout(() => setMsg(''), 3000) }}
        />
      )}
    </div>
  )
}

function btnStyle(color: string, small = false): React.CSSProperties {
  return {
    background: color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
    padding: small ? '6px 12px' : '8px 16px', fontSize: small ? 12 : 14, fontWeight: 600,
  }
}

function toggleBtnStyle(active: boolean, activeColor: string): React.CSSProperties {
  return {
    background: active ? activeColor + '20' : '#F3F4F6',
    color: active ? activeColor : '#6B7280',
    border: `1px solid ${active ? activeColor + '50' : '#E5E7EB'}`,
    borderRadius: 20, cursor: 'pointer',
    padding: '3px 10px', fontSize: 11, fontWeight: 600,
  }
}
