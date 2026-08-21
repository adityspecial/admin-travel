'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { adminFetch, supabase } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Pagination, usePagination } from '@/components/Pagination'
import { Building2, CheckCircle2, XCircle, BedDouble, Plus, Pencil, Trash2, ImagePlus, Search, Upload, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

// Example rows double as inline documentation — the second hotel's two rows
// (same hotel_name + city_name) show how multiple rooms group into one
// hotel, which isn't obvious from column headers alone.
const TEMPLATE_ROWS = [
  { hotel_name: 'The Grand Residency', city_name: 'New Delhi', address: 'Connaught Place, New Delhi', description: 'Direct tie-up hotel in central Delhi', star_rating: 4, amenities: 'Free WiFi, Breakfast Included, Airport Pickup', room_name: 'Deluxe Room', meal_plan: 'Breakfast Included', base_price: 4500, tax: 500, is_refundable: 'TRUE' },
  { hotel_name: 'Seaside Business Inn', city_name: 'Mumbai', address: 'Bandra Kurla Complex, Mumbai', description: 'Direct tie-up hotel near BKC', star_rating: 3, amenities: 'Free WiFi, Gym', room_name: 'Standard Room', meal_plan: 'Room Only', base_price: 3200, tax: 350, is_refundable: 'FALSE' },
  { hotel_name: 'Seaside Business Inn', city_name: 'Mumbai', address: 'Bandra Kurla Complex, Mumbai', description: 'Direct tie-up hotel near BKC', star_rating: 3, amenities: 'Free WiFi, Gym', room_name: 'Executive Suite', meal_plan: 'Breakfast Included', base_price: 5800, tax: 650, is_refundable: 'TRUE' },
]

function downloadHotelExcelTemplate() {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS)
  ws['!cols'] = [
    { wch: 22 }, { wch: 14 }, { wch: 28 }, { wch: 30 }, { wch: 11 },
    { wch: 34 }, { wch: 16 }, { wch: 18 }, { wch: 11 }, { wch: 8 }, { wch: 12 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Offline Hotels')
  XLSX.writeFile(wb, 'offline-hotels-template.xlsx')
}

interface CitySuggestion { city_id: number; city_name: string; state_province?: string; country_code?: string }

interface ImportRoom { room_name: string; meal_plan?: string; base_price: number; tax?: number; is_refundable?: boolean }
interface ImportHotel {
  name: string; city_name: string; address?: string; description?: string
  star_rating?: number; amenities?: string[]; rooms: ImportRoom[]
}
interface BulkImportResult { created: string[]; failed: { name: string; reason: string }[]; needsCityCode: string[] }

// Accepts either snake_case or human-friendly Title Case column headers —
// one row = one room type; rows sharing the same hotel name + city are
// grouped into one hotel with multiple rooms.
function parseHotelExcelRows(rows: any[]): ImportHotel[] {
  const pick = (row: any, ...keys: string[]) => {
    for (const k of keys) if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim()
    return ''
  }
  const map = new Map<string, ImportHotel>()
  for (const row of rows) {
    const name = pick(row, 'hotel_name', 'Hotel Name', 'name', 'Name')
    const cityName = pick(row, 'city_name', 'City Name')
    if (!name || !cityName) continue
    const key = `${name.toLowerCase()}|${cityName.toLowerCase()}`
    if (!map.has(key)) {
      map.set(key, {
        name, city_name: cityName,
        address: pick(row, 'address', 'Address') || undefined,
        description: pick(row, 'description', 'Description') || undefined,
        star_rating: Number(pick(row, 'star_rating', 'Star Rating')) || undefined,
        amenities: pick(row, 'amenities', 'Amenities').split(/[,;]/).map(s => s.trim()).filter(Boolean),
        rooms: [],
      })
    }
    const roomName = pick(row, 'room_name', 'Room Name')
    const basePrice = Number(pick(row, 'base_price', 'Base Price'))
    if (roomName && basePrice > 0) {
      map.get(key)!.rooms.push({
        room_name: roomName,
        meal_plan: pick(row, 'meal_plan', 'Meal Plan') || undefined,
        base_price: basePrice,
        tax: Number(pick(row, 'tax', 'Tax')) || 0,
        is_refundable: /^(true|yes|1)$/i.test(pick(row, 'is_refundable', 'Refundable')),
      })
    }
  }
  return [...map.values()]
}

interface Room {
  id: string
  room_name: string
  meal_plan: string | null
  is_refundable: boolean
  base_price: number
  purchase_price: number
  tax: number
}

interface Hotel {
  id: string
  name: string
  city_code: string
  city_name: string
  address: string | null
  description: string | null
  star_rating: number | null
  amenities: string[]
  images: string[]
  is_available: boolean
  offline_hotel_rooms: Room[]
  billing_instructions: string | null
  cancellation_policy_text: string | null
  special_remarks: string | null
  emergency_contact_no: string | null
  inclusions: string | null
  airport_transfer: string | null
}

const BLANK = {
  name: '', city_code: '', city_name: '', address: '', description: '',
  star_rating: '', amenities: '', images: [] as string[], is_available: true,
  billing_instructions: '', cancellation_policy_text: '', special_remarks: '',
  emergency_contact_no: '', inclusions: '', airport_transfer: '',
}

const BLANK_ROOM = { room_name: '', meal_plan: '', is_refundable: false, base_price: '', purchase_price: '', tax: '' }

export default function OfflineHotelsPage() {
  const [items, setItems]               = useState<Hotel[]>([])
  const [loading, setLoading]           = useState(true)
  const [msg, setMsg]                   = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState<string | null>(null)
  const [form, setForm]                 = useState(BLANK)
  const [saving, setSaving]             = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [newRoom, setNewRoom]           = useState(BLANK_ROOM)
  const [savingRoom, setSavingRoom]     = useState(false)
  // Set while editing an already-saved room (persisted, has a real id) —
  // reuses the same newRoom form/inputs, just PATCHes instead of POSTs.
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  // Room types staged while creating a NEW hotel (no id to attach them to
  // yet) — posted to /rooms one by one right after the hotel itself is
  // created. Edit mode still adds rooms immediately via newRoom/addRoom.
  const [pendingRooms, setPendingRooms] = useState<(typeof BLANK_ROOM)[]>([])
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult]     = useState<BulkImportResult | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch('/api/admin/super/offline-hotels')
      .then((d: { items: Hotel[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  function openCreate() {
    setEditId(null)
    setForm(BLANK)
    setPendingRooms([])
    setShowForm(true)
  }

  function openEdit(it: Hotel) {
    setEditId(it.id)
    setForm({
      name: it.name, city_code: it.city_code, city_name: it.city_name,
      address: it.address ?? '', description: it.description ?? '',
      star_rating: it.star_rating ? String(it.star_rating) : '',
      amenities: (it.amenities ?? []).join(', '),
      images: it.images ?? [],
      is_available: it.is_available,
      billing_instructions: it.billing_instructions ?? '',
      cancellation_policy_text: it.cancellation_policy_text ?? '',
      special_remarks: it.special_remarks ?? '',
      emergency_contact_no: it.emergency_contact_no ?? '',
      inclusions: it.inclusions ?? '',
      airport_transfer: it.airport_transfer ?? '',
    })
    setNewRoom(BLANK_ROOM)
    setEditingRoomId(null)
    setShowForm(true)
  }

  // ── City autosuggest (reuses the same /api/hotels/cities the booking
  // widgets use — returns the real TBO city_id, so city_code always matches
  // what /api/hotels/search actually receives instead of being hand-typed). ──
  function onCityNameChange(v: string) {
    setForm(p => ({ ...p, city_name: v }))
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    if (v.trim().length < 2) { setCitySuggestions([]); setShowCitySuggestions(false); return }
    cityDebounce.current = setTimeout(() => {
      fetch(`/api/hotels/cities?query=${encodeURIComponent(v.trim())}`)
        .then(r => r.json())
        .then(d => { setCitySuggestions(d.cities ?? []); setShowCitySuggestions(true) })
        .catch(() => {})
    }, 300)
  }

  function pickCitySuggestion(c: CitySuggestion) {
    setForm(p => ({ ...p, city_name: c.city_name, city_code: String(c.city_id) }))
    setShowCitySuggestions(false)
  }

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const ext = file.name.split('.').pop()
        const path = `offline-hotels/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true })
        if (upErr) throw new Error(upErr.message)
        const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(path)
        urls.push(publicUrl)
      }
      setForm(p => ({ ...p, images: [...p.images, ...urls] }))
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Image upload failed'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(url: string) {
    setForm(p => ({ ...p, images: p.images.filter(u => u !== url) }))
  }

  async function save() {
    if (!form.name || !form.city_code || !form.city_name) {
      flash('Name, City Code and City Name are required.')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: form.name, city_code: form.city_code, city_name: form.city_name,
        address: form.address || null, description: form.description || null,
        star_rating: form.star_rating || null,
        amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images: form.images,
        is_available: form.is_available,
        billing_instructions: form.billing_instructions || null,
        cancellation_policy_text: form.cancellation_policy_text || null,
        special_remarks: form.special_remarks || null,
        emergency_contact_no: form.emergency_contact_no || null,
        inclusions: form.inclusions || null,
        airport_transfer: form.airport_transfer || null,
      }
      if (editId) {
        await adminFetch(`/api/admin/super/offline-hotels/${editId}`, { method: 'PATCH', body: JSON.stringify(body) })
        flash('Updated successfully.')
      } else {
        const res = await adminFetch('/api/admin/super/offline-hotels', { method: 'POST', body: JSON.stringify(body) })
        // Rooms staged before the hotel had an id — post them now, one by
        // one, against the id the create call just returned.
        for (const room of pendingRooms) {
          await adminFetch(`/api/admin/super/offline-hotels/${res.item.id}/rooms`, {
            method: 'POST',
            body: JSON.stringify({ ...room, base_price: Number(room.base_price), tax: Number(room.tax) || 0 }),
          }).catch(() => {})
        }
        flash('Created successfully.')
        setShowForm(false)
        setEditId(null)
        setPendingRooms([])
      }
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Failed'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailable(it: Hotel) {
    await adminFetch(`/api/admin/super/offline-hotels/${it.id}`, {
      method: 'PATCH', body: JSON.stringify({ is_available: !it.is_available }),
    })
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/super/offline-hotels/${deleteTarget.id}`, { method: 'DELETE' })
      flash('Deleted successfully.')
      setDeleteTarget(null)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Delete failed'))
    } finally {
      setDeleting(false)
    }
  }

  async function saveRoom() {
    if (!editId || !newRoom.room_name || !newRoom.base_price) {
      flash('Room name and base price are required.')
      return
    }
    setSavingRoom(true)
    try {
      const body = {
        ...newRoom, base_price: Number(newRoom.base_price),
        purchase_price: Number(newRoom.purchase_price) || 0,
        tax: Number(newRoom.tax) || 0,
      }
      if (editingRoomId) {
        await adminFetch(`/api/admin/super/offline-hotels/${editId}/rooms/${editingRoomId}`, {
          method: 'PATCH', body: JSON.stringify(body),
        })
      } else {
        await adminFetch(`/api/admin/super/offline-hotels/${editId}/rooms`, {
          method: 'POST', body: JSON.stringify(body),
        })
      }
      setNewRoom(BLANK_ROOM)
      setEditingRoomId(null)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not save room'))
    } finally {
      setSavingRoom(false)
    }
  }

  function startEditRoom(room: Room) {
    setEditingRoomId(room.id)
    setNewRoom({
      room_name: room.room_name, meal_plan: room.meal_plan ?? '',
      is_refundable: room.is_refundable,
      base_price: String(room.base_price), purchase_price: String(room.purchase_price ?? 0),
      tax: String(room.tax),
    })
  }

  function cancelEditRoom() {
    setEditingRoomId(null)
    setNewRoom(BLANK_ROOM)
  }

  async function deleteRoom(roomId: string) {
    if (!editId) return
    if (editingRoomId === roomId) cancelEditRoom()
    await adminFetch(`/api/admin/super/offline-hotels/${editId}/rooms/${roomId}`, { method: 'DELETE' })
    load()
  }

  async function handleBulkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBulkUploading(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(sheet)
      const hotels = parseHotelExcelRows(rows)
      if (!hotels.length) { flash('Error: No valid hotel rows found in the sheet.'); return }
      const res = await adminFetch('/api/admin/super/offline-hotels/bulk-import', {
        method: 'POST', body: JSON.stringify({ hotels }),
      })
      setBulkResult(res)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not read that file'))
    } finally {
      setBulkUploading(false)
    }
  }

  function f(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm((p) => ({ ...p, [key]: v }))
    }
  }

  const availableCount = useMemo(() => items.filter(i => i.is_available).length, [items])
  const unavailableCount = useMemo(() => items.filter(i => !i.is_available).length, [items])
  const roomCount = useMemo(() => items.reduce((s, i) => s + (i.offline_hotel_rooms?.length ?? 0), 0), [items])

  const editingHotel = items.find(i => i.id === editId)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => i.name.toLowerCase().includes(q) || i.city_name.toLowerCase().includes(q))
  }, [items, searchQuery])
  const { page, setPage, slice, total } = usePagination(filteredItems, 20)

  const columns: ColumnDef<Hotel>[] = [
    {
      key: 'name',
      header: 'Hotel',
      render: (it) => (
        <div>
          <div className="data-table-cell-bold">{it.name}</div>
          <div className="data-table-muted-cell">{it.city_name} ({it.city_code})</div>
        </div>
      ),
    },
    {
      key: 'rooms',
      header: 'Rooms',
      render: (it) => <span className="data-table-code-pill">{it.offline_hotel_rooms?.length ?? 0}</span>,
    },
    {
      key: 'star_rating',
      header: 'Rating',
      render: (it) => <span>{it.star_rating ? `${it.star_rating} Star` : '—'}</span>,
    },
    {
      key: 'is_available',
      header: 'Status',
      render: (it) => (
        <button
          type="button"
          onClick={() => toggleAvailable(it)}
          className={`data-table-status-pill oh-status-toggle-btn ${it.is_available ? 'active' : 'inactive'}`}
          title={it.is_available ? 'Click to mark unavailable' : 'Click to mark available'}
        >
          {it.is_available ? '● Available' : '● Unavailable'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (it) => (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => openEdit(it)}>
            <Pencil size={12} /><span>Edit</span>
          </button>
          <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => setDeleteTarget(it)}>
            <Trash2 size={12} /><span>Delete</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Offline / Direct Partner Hotels</h2>
        <span className="topbar-meta">{items.length.toLocaleString('en-IN')} tie-up hotels configured</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Building2} label="Total Hotels" value={items.length} sub="Direct tie-up inventory" badge="Inventory" />
            <StatCard Icon={CheckCircle2} label="Available" value={availableCount} sub="Showing in search" badge="Live" />
            <StatCard Icon={XCircle} label="Unavailable" value={unavailableCount} sub="Hidden from search" badge="Paused" />
            <StatCard Icon={BedDouble} label="Room Types" value={roomCount} sub="Across all hotels" badge="Rooms" />
          </div>

          {msg && (
            <div className={`fc-alert ${msg.startsWith('Error') ? 'fc-alert--error' : 'fc-alert--ok'}`}>
              {msg.startsWith('Error') ? '❌ ' : '✅ '}{msg}
            </div>
          )}

          <DataTable
            title="Direct Partner Hotels"
            subtitle="Hotels AirDunia has a direct tie-up with — managed by hand, not fetched live from TBO. Bulk Upload expects one row per room type: hotel_name, city_name, address, description, star_rating, amenities, room_name, meal_plan, base_price, tax, is_refundable — rows sharing the same hotel_name + city_name become one hotel with multiple rooms."
            headerAction={
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <AppInput
                  placeholder="Search name or city…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={15} />}
                  wrapperClassName="m-0"
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={downloadHotelExcelTemplate}>
                  <Download size={14} /><span>Download Template</span>
                </button>
                <label className="btn btn-ghost btn-sm" style={{ cursor: bulkUploading ? 'not-allowed' : 'pointer' }}>
                  <Upload size={14} /><span>{bulkUploading ? 'Uploading…' : 'Bulk Upload'}</span>
                  <input type="file" accept=".xlsx,.xls,.csv" hidden disabled={bulkUploading} onChange={handleBulkFile} />
                </label>
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <Plus size={14} /><span>New Hotel</span>
                </button>
              </div>
            }
            columns={columns}
            data={slice}
            loading={loading}
            emptyMessage="No offline hotels configured yet."
            keyExtractor={(it) => it.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      <AppPopup
        isOpen={showForm}
        title={editId ? 'Edit Offline Hotel' : 'New Offline Hotel'}
        subtitle="Direct tie-up inventory — entered by hand, shown as 'Direct Partner Hotels' in search"
        icon={<Building2 size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={980}
        onClose={() => { setShowForm(false); setEditId(null) }}
      >
        <form onSubmit={(e) => { e.preventDefault(); save() }}>
          <div className="fc-form-grid">
            <div className="fc-full-col">
              <AppInput label="Hotel Name *" required value={form.name} onChange={f('name')} placeholder="e.g. The Grand Residency" />
            </div>
            <div style={{ position: 'relative' }}>
              <AppInput
                label="City Name *" required value={form.city_name}
                onChange={e => onCityNameChange(e.target.value)}
                onFocus={() => { if (citySuggestions.length) setShowCitySuggestions(true) }}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                placeholder="Start typing a city…" autoComplete="off"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, marginTop: 4, boxShadow: '0 8px 20px rgba(0,0,0,0.08)', maxHeight: 220, overflowY: 'auto' }}>
                  {citySuggestions.map(c => (
                    <button
                      key={c.city_id} type="button"
                      onMouseDown={() => pickCitySuggestion(c)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
                    >
                      {c.city_name}{c.state_province ? `, ${c.state_province}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <AppInput label="City Code *" required value={form.city_code} onChange={f('city_code')} placeholder="Auto-filled from the city you pick above" />
            <div className="fc-full-col">
              <AppInput label="Address" value={form.address} onChange={f('address')} placeholder="Street address" />
            </div>
            <div className="fc-full-col">
              <AppInput label="Description" value={form.description} onChange={f('description')} placeholder="Short description shown to guests" />
            </div>
            <AppInput label="Star Rating" type="number" value={form.star_rating} onChange={f('star_rating')} placeholder="1-5" />
            <AppInput label="Amenities (comma-separated)" value={form.amenities} onChange={f('amenities')} placeholder="WiFi, Pool, Breakfast" />

            <div className="fc-full-col fc-checkbox-row">
              <input type="checkbox" checked={form.is_available} onChange={f('is_available')} id="avail" className="fc-checkbox" />
              <label htmlFor="avail" className="fc-checkbox-label">Available — show this hotel in search results</label>
            </div>

            <div className="fc-full-col">
              <label className="app-input-label">Images</label>
              <div className="fc-color-presets">
                {form.images.map(url => (
                  <div key={url} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0' }} />
                    <button type="button" onClick={() => removeImage(url)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 11, lineHeight: '18px' }}>×</button>
                  </div>
                ))}
                <label className="btn btn-ghost btn-sm" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  <ImagePlus size={14} /><span>{uploading ? 'Uploading…' : 'Add'}</span>
                  <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={handleImageFiles} />
                </label>
              </div>
            </div>

            <div className="fc-full-col" style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <label className="app-input-label">Voucher &amp; Billing Details</label>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 10 }}>
                Shown on every booking's voucher for this hotel — set once here, not per booking.
              </div>
            </div>
            <div className="fc-full-col">
              <AppInput label="Inclusions" value={form.inclusions} onChange={f('inclusions')} placeholder="e.g. Room + WiFi + Breakfast" />
            </div>
            <AppInput label="Airport Transfer" value={form.airport_transfer} onChange={f('airport_transfer')} placeholder="e.g. No, or pickup details" />
            <AppInput label="Emergency Contact No" value={form.emergency_contact_no} onChange={f('emergency_contact_no')} placeholder="e.g. 8178270819" />
            <div className="fc-full-col">
              <AppInput label="Billing Instructions" value={form.billing_instructions} onChange={f('billing_instructions')} placeholder="e.g. Room BTC, Extra Direct by Guest" />
            </div>
            <div className="fc-full-col">
              <AppInput label="Cancellation Clause" value={form.cancellation_policy_text} onChange={f('cancellation_policy_text')} placeholder="e.g. Free cancellation up to 72 hours before check-in" />
            </div>
            <div className="fc-full-col">
              <AppInput label="Special Remarks (e.g. GST note)" value={form.special_remarks} onChange={f('special_remarks')} placeholder={'e.g. GST (18%) is applicable on final invoice'} />
            </div>
          </div>

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => { setShowForm(false); setEditId(null) }}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update Hotel' : 'Create Hotel'}
            </button>
          </div>
        </form>

        {!editId && (
          <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 18 }}>
            <div className="app-input-label" style={{ marginBottom: 10 }}>Rooms (added once you click Create Hotel below)</div>
            {pendingRooms.map((room, i) => (
              <div key={i} className="data-table-actions" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div className="data-table-cell-bold">{room.room_name}</div>
                  <div className="data-table-muted-cell">
                    Sell ₹{room.base_price} · Cost ₹{room.purchase_price || 0}
                    {room.base_price && (
                      <span style={{ color: Number(room.base_price) - Number(room.purchase_price || 0) >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                        {' '}(margin ₹{Math.round(Number(room.base_price) - Number(room.purchase_price || 0))})
                      </span>
                    )}
                    {' '}+ ₹{room.tax || 0} tax · {room.meal_plan || 'No meal plan'} · {room.is_refundable ? 'Refundable' : 'Non-refundable'}
                  </div>
                </div>
                <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => setPendingRooms(p => p.filter((_, idx) => idx !== i))}>
                  <Trash2 size={12} /><span>Remove</span>
                </button>
              </div>
            ))}

            <div className="fc-form-grid" style={{ marginTop: 12 }}>
              <AppInput label="Room Name" value={newRoom.room_name} onChange={e => setNewRoom(p => ({ ...p, room_name: e.target.value }))} placeholder="e.g. Deluxe Room" />
              <AppInput label="Meal Plan" value={newRoom.meal_plan} onChange={e => setNewRoom(p => ({ ...p, meal_plan: e.target.value }))} placeholder="e.g. Breakfast Included" />
              <AppInput label="Selling Price / Night *" type="number" value={newRoom.base_price} onChange={e => setNewRoom(p => ({ ...p, base_price: e.target.value }))} placeholder="e.g. 4500" />
              <AppInput label="Purchase Price / Night (our cost)" type="number" value={newRoom.purchase_price} onChange={e => setNewRoom(p => ({ ...p, purchase_price: e.target.value }))} placeholder="e.g. 3800" />
              <AppInput label="Tax / Night" type="number" value={newRoom.tax} onChange={e => setNewRoom(p => ({ ...p, tax: e.target.value }))} placeholder="e.g. 500" />
              <div className="fc-full-col fc-checkbox-row">
                <input type="checkbox" checked={newRoom.is_refundable} onChange={e => setNewRoom(p => ({ ...p, is_refundable: e.target.checked }))} id="pendingRoomRefundable" className="fc-checkbox" />
                <label htmlFor="pendingRoomRefundable" className="fc-checkbox-label">Refundable</label>
              </div>
            </div>
            <button
              type="button" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}
              onClick={() => {
                if (!newRoom.room_name || !newRoom.base_price) { flash('Room name and base price are required.'); return }
                setPendingRooms(p => [...p, newRoom])
                setNewRoom(BLANK_ROOM)
              }}
            >
              <Plus size={14} /><span>Add Room</span>
            </button>
          </div>
        )}

        {editId && (
          <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 18 }}>
            <div className="app-input-label" style={{ marginBottom: 10 }}>Rooms</div>
            {(editingHotel?.offline_hotel_rooms ?? []).map(room => (
              editingRoomId === room.id ? (
                <div key={room.id} style={{ padding: '12px', margin: '4px 0', borderRadius: 8, border: '1px solid #93C5FD', background: '#EFF6FF' }}>
                  <div className="fc-form-grid">
                    <AppInput label="Room Name" value={newRoom.room_name} onChange={e => setNewRoom(p => ({ ...p, room_name: e.target.value }))} placeholder="e.g. Deluxe Room" />
                    <AppInput label="Meal Plan" value={newRoom.meal_plan} onChange={e => setNewRoom(p => ({ ...p, meal_plan: e.target.value }))} placeholder="e.g. Breakfast Included" />
                    <AppInput label="Selling Price / Night *" type="number" value={newRoom.base_price} onChange={e => setNewRoom(p => ({ ...p, base_price: e.target.value }))} placeholder="e.g. 4500" />
                    <AppInput label="Purchase Price / Night (our cost)" type="number" value={newRoom.purchase_price} onChange={e => setNewRoom(p => ({ ...p, purchase_price: e.target.value }))} placeholder="e.g. 3800" />
                    <AppInput label="Tax / Night" type="number" value={newRoom.tax} onChange={e => setNewRoom(p => ({ ...p, tax: e.target.value }))} placeholder="e.g. 500" />
                    <div className="fc-full-col fc-checkbox-row">
                      <input type="checkbox" checked={newRoom.is_refundable} onChange={e => setNewRoom(p => ({ ...p, is_refundable: e.target.checked }))} id="roomRefundable" className="fc-checkbox" />
                      <label htmlFor="roomRefundable" className="fc-checkbox-label">Refundable</label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={saveRoom} disabled={savingRoom}>
                      <span>{savingRoom ? 'Saving…' : 'Save Changes'}</span>
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEditRoom} disabled={savingRoom}>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div key={room.id} className="data-table-actions" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <div className="data-table-cell-bold">{room.room_name}</div>
                    <div className="data-table-muted-cell">
                      Sell ₹{room.base_price} · Cost ₹{room.purchase_price || 0}
                      <span style={{ color: Number(room.base_price) - Number(room.purchase_price || 0) >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                        {' '}(margin ₹{Math.round(Number(room.base_price) - Number(room.purchase_price || 0))})
                      </span>
                      {' '}+ ₹{room.tax} tax · {room.meal_plan || 'No meal plan'} · {room.is_refundable ? 'Refundable' : 'Non-refundable'}
                    </div>
                  </div>
                  <div className="data-table-actions">
                    <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => startEditRoom(room)}>
                      <Pencil size={12} /><span>Edit</span>
                    </button>
                    <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => deleteRoom(room.id)}>
                      <Trash2 size={12} /><span>Delete</span>
                    </button>
                  </div>
                </div>
              )
            ))}

            {!editingRoomId && (
              <>
                <div className="app-input-label" style={{ marginTop: 14, marginBottom: 4 }}>Add Room</div>
                <div className="fc-form-grid" style={{ marginTop: 8 }}>
                  <AppInput label="Room Name" value={newRoom.room_name} onChange={e => setNewRoom(p => ({ ...p, room_name: e.target.value }))} placeholder="e.g. Deluxe Room" />
                  <AppInput label="Meal Plan" value={newRoom.meal_plan} onChange={e => setNewRoom(p => ({ ...p, meal_plan: e.target.value }))} placeholder="e.g. Breakfast Included" />
                  <AppInput label="Selling Price / Night *" type="number" value={newRoom.base_price} onChange={e => setNewRoom(p => ({ ...p, base_price: e.target.value }))} placeholder="e.g. 4500" />
                  <AppInput label="Purchase Price / Night (our cost)" type="number" value={newRoom.purchase_price} onChange={e => setNewRoom(p => ({ ...p, purchase_price: e.target.value }))} placeholder="e.g. 3800" />
                  <AppInput label="Tax / Night" type="number" value={newRoom.tax} onChange={e => setNewRoom(p => ({ ...p, tax: e.target.value }))} placeholder="e.g. 500" />
                  <div className="fc-full-col fc-checkbox-row">
                    <input type="checkbox" checked={newRoom.is_refundable} onChange={e => setNewRoom(p => ({ ...p, is_refundable: e.target.checked }))} id="pendingRoomRefundable2" className="fc-checkbox" />
                    <label htmlFor="pendingRoomRefundable2" className="fc-checkbox-label">Refundable</label>
                  </div>
                </div>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={saveRoom} disabled={savingRoom}>
                  <Plus size={14} /><span>{savingRoom ? 'Adding…' : 'Add Room'}</span>
                </button>
              </>
            )}
          </div>
        )}
      </AppPopup>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Offline Hotel"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This also deletes all its room types.`}
        confirmLabel="Delete Hotel"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AppPopup
        isOpen={Boolean(bulkResult)}
        title="Bulk Upload Results"
        subtitle={bulkResult ? `${bulkResult.created.length} hotel(s) created, ${bulkResult.failed.length} failed` : ''}
        icon={<Upload size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={560}
        onClose={() => setBulkResult(null)}
      >
        {bulkResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bulkResult.created.length > 0 && (
              <div>
                <div className="app-input-label" style={{ marginBottom: 6 }}>Created ({bulkResult.created.length})</div>
                <div className="data-table-muted-cell">{bulkResult.created.join(', ')}</div>
              </div>
            )}
            {bulkResult.needsCityCode.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 4 }}>
                  ⚠ City code not found for {bulkResult.needsCityCode.length} hotel(s)
                </div>
                <div style={{ fontSize: 12.5, color: '#92400E', marginBottom: 6 }}>
                  These were created but won't show in search until you edit them and pick the city from the autosuggest:
                </div>
                <div className="data-table-muted-cell">{bulkResult.needsCityCode.join(', ')}</div>
              </div>
            )}
            {bulkResult.failed.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#DC2626', marginBottom: 6 }}>Failed ({bulkResult.failed.length})</div>
                {bulkResult.failed.map((f, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: '#DC2626', marginBottom: 2 }}>{f.name}: {f.reason}</div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="app-popup-footer">
          <button type="button" className="confirm-modal-btn confirm-modal-btn-success" onClick={() => setBulkResult(null)}>
            Done
          </button>
        </div>
      </AppPopup>
    </div>
  )
}
