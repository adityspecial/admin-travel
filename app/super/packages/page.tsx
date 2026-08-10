'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminFetch } from '@/lib/api'
import { PackageEditModal } from './PackageEditModal'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppImageModal } from '@/components/ui/AppImageModal'
import { Pagination } from '@/components/Pagination'
import { Package, Sparkles, CheckCircle2, Compass, Search, Pencil, Star, MapPin, Plus } from 'lucide-react'

interface HolidayPackage {
  id: string
  name: string
  destination: string
  duration_nights: number
  duration_days: number
  base_price: number
  operator: string | null
  rating: number | null
  is_featured: boolean
  is_active: boolean
  thumbnail_url: string | null
  created_at: string
}

const PAGE_SIZE = 20

export default function SuperPackagesPage() {
  const [packages, setPackages]         = useState<HolidayPackage[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [editId, setEditId]             = useState<string | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [msg, setMsg]                   = useState('')
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; subtitle?: string } | null>(null)

  const load = useCallback((q: string, p: number) => {
    setLoading(true)
    adminFetch(`/api/admin/super/packages?search=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}`)
      .then((d: { packages: HolidayPackage[]; total: number }) => {
        setPackages(d.packages ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(search, page)
  }, [page, load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  async function toggleActive(pkg: HolidayPackage) {
    await adminFetch(`/api/admin/super/packages/${pkg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !pkg.is_active }),
    })
    load(search, page)
  }

  async function toggleFeatured(pkg: HolidayPackage) {
    await adminFetch(`/api/admin/super/packages/${pkg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: !pkg.is_featured }),
    })
    load(search, page)
  }

  const featuredCount = useMemo(() => packages.filter((p) => p.is_featured).length, [packages])
  const activeCount   = useMemo(() => packages.filter((p) => p.is_active).length, [packages])
  const avgPrice      = useMemo(() => {
    if (packages.length === 0) return '₹0'
    const sum = packages.reduce((acc, p) => acc + (p.base_price ?? 0), 0)
    return `₹${Math.round(sum / packages.length).toLocaleString('en-IN')}`
  }, [packages])

  const columns: ColumnDef<HolidayPackage>[] = [
    {
      key: 'thumbnail_url',
      header: 'Image',
      render: (pkg) => (
        <div
          onClick={() =>
            pkg.thumbnail_url &&
            setPreviewImage({
              src: pkg.thumbnail_url,
              title: pkg.name,
              subtitle: pkg.destination,
            })
          }
          className={`pkg-thumb-cell ${pkg.thumbnail_url ? 'pkg-thumb-cell--clickable' : ''}`}
          title={pkg.thumbnail_url ? 'Click to open full desktop preview' : undefined}
        >
          {pkg.thumbnail_url ? (
            <img src={pkg.thumbnail_url} alt="" className="pkg-thumb-img" />
          ) : (
            <div className="pkg-thumb-empty">
              No img
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Package Title',
      render: (pkg) => (
        <div className="pkg-title-cell">
          <div className="data-table-cell-bold pkg-title-text">
            {pkg.name}
          </div>
          {pkg.rating != null && (
            <div className="pkg-rating-row">
              <Star size={11} fill="#d97706" />
              <span>{pkg.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (pkg) => (
        <div className="pkg-dest-row">
          <MapPin size={13} color="#64748b" />
          <span>{pkg.destination}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (pkg) => (
        <span className="data-table-code-pill pkg-duration-pill">
          {pkg.duration_nights}N / {pkg.duration_days}D
        </span>
      ),
    },
    {
      key: 'base_price',
      header: 'Base Price',
      render: (pkg) => (
        <span className="pkg-price-cell">
          ₹{pkg.base_price.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'operator',
      header: 'Operator / DMC',
      render: (pkg) => <span className="data-table-muted-cell">{pkg.operator ?? '—'}</span>,
    },
    {
      key: 'is_featured',
      header: 'Featured',
      render: (pkg) => (
        <button
          type="button"
          onClick={() => toggleFeatured(pkg)}
          className={`pkg-feature-btn ${pkg.is_featured ? 'pkg-feature-btn--on' : ''}`}
        >
          <Sparkles size={11} fill={pkg.is_featured ? '#b45309' : 'none'} />
          <span>{pkg.is_featured ? 'Featured' : 'Feature'}</span>
        </button>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (pkg) => (
        <button
          type="button"
          onClick={() => toggleActive(pkg)}
          className={`data-table-status-pill pkg-status-toggle-btn ${pkg.is_active ? 'active' : 'inactive'}`}
        >
          {pkg.is_active ? '●Active' : '●Inactive'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (pkg) => (
        <div className="data-table-actions">
          <button
            type="button"
            className="data-table-btn data-table-btn-edit"
            onClick={() => setEditId(pkg.id)}
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Holiday Packages</h2>
        <span className="topbar-meta">{total.toLocaleString('en-IN')} packages total</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Add Package
        </button>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Stat Cards */}
          <div className="stat-grid">
            <StatCard
              Icon={Package}
              label="Total Packages"
              value={total}
              sub="Catalog inventory"
              badge="Packages"
            />
            <StatCard
              Icon={Sparkles}
              label="Featured Packages"
              value={featuredCount}
              sub="Highlighted on storefronts"
              badge="Storefront"
            />
            <StatCard
              Icon={CheckCircle2}
              label="Active Listings"
              value={activeCount}
              sub="Bookable online"
              badge="Live"
            />
            <StatCard
              Icon={Compass}
              label="Avg Base Price"
              value={avgPrice}
              sub="Average catalog pricing"
              badge="Pricing"
            />
          </div>

          {/* Alert Message Banner */}
          {msg && (
            <div className="pkg-alert-ok">
              ✅ {msg}
            </div>
          )}

          {/* DataTable */}
          <DataTable
            title="Package Inventory"
            subtitle="Browse, filter, toggle featured status, and edit itinerary details for all holiday packages."
            headerAction={
              <form onSubmit={handleSearch} className="pkg-search-form">
                <div className="pkg-flex-1">
                  <AppInput
                    placeholder="Search name, destination, operator..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                    className="pkg-search-input"
                  />
                </div>
                {search && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSearch('')
                      setPage(1)
                      load('', 1)
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>
            }
            columns={columns}
            data={packages}
            loading={loading}
            emptyMessage="No holiday packages found matching your search filter."
            keyExtractor={(pkg) => pkg.id}
            footer={
              <Pagination
                total={total}
                page={page}
                perPage={PAGE_SIZE}
                onPage={setPage}
              />
            }
          />
        </div>
      </div>

      {(editId || showCreate) && (
        <PackageEditModal
          pkgId={editId}
          onClose={() => { setEditId(null); setShowCreate(false) }}
          onSaved={() => {
            setMsg(editId ? 'Package updated successfully!' : 'Package created successfully!')
            load(search, page)
            setTimeout(() => setMsg(''), 3000)
          }}
        />
      )}

      {/* Full Desktop Image Preview Modal */}
      <AppImageModal
        isOpen={Boolean(previewImage)}
        src={previewImage?.src ?? null}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}
