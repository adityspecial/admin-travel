'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminFetch, adminDownload } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { ClipboardList, Clock, CreditCard, CheckCircle2, Check, X, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Booking {
  id: string
  booking_ref: string
  hotel_name: string
  city_name: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  check_in: string
  check_out: string
  nights: number
  room_count: number
  adult_count: number
  room_type: string | null
  base_fare: number
  tax: number
  markup_applied: number
  final_fare: number
  status: string
  created_at: string
  assigned_to: string | null
  assigned_to_email: string | null
  org_id: string | null
  org_name: string | null
}

interface Staff { id: string; email: string }

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: '● Pending Confirmation',
  awaiting_payment: '● Awaiting Payment',
  confirmed: '● Confirmed',
  cancelled: '● Cancelled',
}

export default function OfflineHotelBookingsPage() {
  const [items, setItems]     = useState<Booking[]>([])
  const [staff, setStaff]     = useState<Staff[]>([])
  const [filter, setFilter]   = useState('pending_confirmation')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null)
  const [rejectTarget, setRejectTarget]   = useState<Booking | null>(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [acting, setActing]   = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/offline-hotel-bookings${filter ? `?status=${filter}` : ''}`)
      .then((d: { items: Booking[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    adminFetch('/api/admin/super/offline-hotel-bookings/assignable-staff')
      .then((d: { staff: Staff[] }) => setStaff(d.staff ?? []))
      .catch(() => {})
  }, [])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function doConfirm() {
    if (!confirmTarget) return
    setActing(true)
    try {
      await adminFetch(`/api/admin/super/offline-hotel-bookings/${confirmTarget.id}/confirm`, { method: 'POST' })
      flash('Confirmed — customer notified to complete payment.')
      setConfirmTarget(null)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not confirm'))
    } finally {
      setActing(false)
    }
  }

  async function doReject() {
    if (!rejectTarget) return
    setActing(true)
    try {
      await adminFetch(`/api/admin/super/offline-hotel-bookings/${rejectTarget.id}/reject`, {
        method: 'POST', body: JSON.stringify({ reason: rejectReason }),
      })
      flash('Request declined — no payment was taken.')
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not reject'))
    } finally {
      setActing(false)
    }
  }

  async function doAssign(booking: Booking, staffId: string) {
    setAssigning(booking.id)
    const person = staff.find(s => s.id === staffId) ?? null
    try {
      await adminFetch(`/api/admin/super/offline-hotel-bookings/${booking.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo: person?.id ?? null, assignedToEmail: person?.email ?? null }),
      })
      setItems(prev => prev.map(b => b.id === booking.id ? { ...b, assigned_to: person?.id ?? null, assigned_to_email: person?.email ?? null } : b))
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not assign'))
    } finally {
      setAssigning(null)
    }
  }

  async function downloadVoucher(booking: Booking) {
    try {
      await adminDownload(`/api/admin/super/offline-hotel-bookings/${booking.id}/voucher`, `voucher-${booking.booking_ref}.pdf`)
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not generate voucher'))
    }
  }

  function exportExcel() {
    const rows = items.map(b => ({
      'Reservation No': b.booking_ref,
      'Hotel': b.hotel_name,
      'City': b.city_name ?? '',
      'Guest': b.guest_name ?? '',
      'Email': b.guest_email ?? '',
      'Phone': b.guest_phone ?? '',
      'Booked By': b.org_name ?? 'Individual',
      'Room Type': b.room_type ?? '',
      'Rooms': b.room_count,
      'Adults': b.adult_count,
      'Check-In': b.check_in,
      'Check-Out': b.check_out,
      'Nights': b.nights,
      'Selling Price (Base Fare)': b.base_fare,
      'Markup': b.markup_applied,
      'GST / Tax': b.tax,
      'Customer Paid': b.final_fare,
      'Status': STATUS_LABEL[b.status] ?? b.status,
      'Assigned To': b.assigned_to_email ?? '',
      'Created At': b.created_at,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Offline Hotel Bookings')
    XLSX.writeFile(wb, `offline-hotel-bookings-${filter || 'all'}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const pendingCount = useMemo(() => items.filter(i => i.status === 'pending_confirmation').length, [items])
  const awaitingPaymentCount = useMemo(() => items.filter(i => i.status === 'awaiting_payment').length, [items])
  const confirmedCount = useMemo(() => items.filter(i => i.status === 'confirmed').length, [items])

  const columns: ColumnDef<Booking>[] = [
    {
      key: 'booking_ref',
      header: 'Request',
      render: (it) => (
        <div>
          <div className="data-table-cell-bold">{it.hotel_name}</div>
          <div className="data-table-muted-cell">{it.booking_ref}</div>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest',
      render: (it) => (
        <div>
          <div>{it.guest_name || '—'}</div>
          <div className="data-table-muted-cell">{it.guest_email}{it.guest_phone ? ` · ${it.guest_phone}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'booked_by',
      header: 'Booked By',
      render: (it) => <span className="data-table-muted-cell">{it.org_name ?? 'Individual'}</span>,
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (it) => <span className="data-table-muted-cell">{it.check_in} → {it.check_out} ({it.nights}N)</span>,
    },
    {
      key: 'final_fare',
      header: 'Amount',
      render: (it) => <span>₹{Number(it.final_fare).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (it) => <span className={`data-table-status-pill ${it.status === 'confirmed' ? 'active' : it.status === 'cancelled' ? 'inactive' : ''}`}>{STATUS_LABEL[it.status] ?? it.status}</span>,
    },
    {
      key: 'assigned',
      header: 'Assigned To',
      render: (it) => (
        <select
          className="form-input"
          style={{ fontSize: 12.5, padding: '4px 8px' }}
          value={it.assigned_to ?? ''}
          disabled={assigning === it.id}
          onChange={e => doAssign(it, e.target.value)}
        >
          <option value="">— Unassigned —</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}
        </select>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (it) => (
        <div className="data-table-actions">
          {it.status === 'pending_confirmation' && (
            <>
              <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => setConfirmTarget(it)}>
                <Check size={12} /><span>Confirm</span>
              </button>
              <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => setRejectTarget(it)}>
                <X size={12} /><span>Reject</span>
              </button>
            </>
          )}
          {it.status === 'confirmed' && (
            <button type="button" className="data-table-btn" onClick={() => downloadVoucher(it)}>
              <Download size={12} /><span>Voucher</span>
            </button>
          )}
          {it.status !== 'pending_confirmation' && it.status !== 'confirmed' && <span className="data-table-muted-cell">—</span>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Offline Hotel Requests</h2>
        <span className="topbar-meta">{items.length.toLocaleString('en-IN')} requests</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Clock} label="Pending Confirmation" value={pendingCount} sub="Needs a call to the hotel" badge="Action needed" />
            <StatCard Icon={CreditCard} label="Awaiting Payment" value={awaitingPaymentCount} sub="Confirmed, customer paying" badge="In progress" />
            <StatCard Icon={CheckCircle2} label="Confirmed & Paid" value={confirmedCount} sub="Fully booked" badge="Done" />
            <StatCard Icon={ClipboardList} label="Total Requests" value={items.length} sub="In this view" badge="All" />
          </div>

          {msg && (
            <div className={`fc-alert ${msg.startsWith('Error') ? 'fc-alert--error' : 'fc-alert--ok'}`}>
              {msg.startsWith('Error') ? '❌ ' : '✅ '}{msg}
            </div>
          )}

          <div className="fc-filter-pills">
            {[
              { value: 'pending_confirmation', label: 'Pending Confirmation' },
              { value: 'awaiting_payment', label: 'Awaiting Payment' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: '', label: 'All' },
            ].map(o => (
              <button key={o.value} className={`btn btn-sm ${filter === o.value ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(o.value)}>
                {o.label}
              </button>
            ))}
          </div>

          <DataTable
            title="Offline Hotel Booking Requests"
            subtitle="Confirm availability directly with the hotel before the customer is asked to pay."
            headerAction={
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportExcel} disabled={!items.length}>
                <FileSpreadsheet size={14} /><span>Export to Excel</span>
              </button>
            }
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="No requests in this view."
            keyExtractor={(it) => it.id}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmTarget)}
        title="Confirm Hotel Availability"
        message={`Confirm that "${confirmTarget?.hotel_name}" has availability for ${confirmTarget?.guest_name}'s stay? The customer will be notified to complete payment.`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={acting}
        onConfirm={doConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(rejectTarget)}
        title="Reject Hotel Request"
        message={
          <div>
            <p>Decline this request for &quot;{rejectTarget?.hotel_name}&quot;? No payment was taken, so nothing needs to be refunded.</p>
            <textarea
              className="app-input"
              style={{ marginTop: 10, width: '100%', minHeight: 70 }}
              placeholder="Reason (optional, shown to the customer)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
        }
        confirmLabel="Reject Request"
        cancelLabel="Cancel"
        tone="danger"
        loading={acting}
        onConfirm={doReject}
        onCancel={() => { setRejectTarget(null); setRejectReason('') }}
      />
    </div>
  )
}
