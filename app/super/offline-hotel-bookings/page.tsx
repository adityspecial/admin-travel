'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { ClipboardList, Clock, CreditCard, CheckCircle2, Check, X } from 'lucide-react'

interface Booking {
  id: string
  booking_ref: string
  hotel_name: string
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  check_in: string
  check_out: string
  nights: number
  final_fare: number
  status: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: '● Pending Confirmation',
  awaiting_payment: '● Awaiting Payment',
  confirmed: '● Confirmed',
  cancelled: '● Cancelled',
}

export default function OfflineHotelBookingsPage() {
  const [items, setItems]     = useState<Booking[]>([])
  const [filter, setFilter]   = useState('pending_confirmation')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null)
  const [rejectTarget, setRejectTarget]   = useState<Booking | null>(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [acting, setActing]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/offline-hotel-bookings${filter ? `?status=${filter}` : ''}`)
      .then((d: { items: Booking[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

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
      key: 'actions',
      header: 'Actions',
      render: (it) => it.status === 'pending_confirmation' ? (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => setConfirmTarget(it)}>
            <Check size={12} /><span>Confirm</span>
          </button>
          <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => setRejectTarget(it)}>
            <X size={12} /><span>Reject</span>
          </button>
        </div>
      ) : <span className="data-table-muted-cell">—</span>,
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
