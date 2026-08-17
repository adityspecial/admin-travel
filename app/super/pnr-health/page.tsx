'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface Flag {
  id: string; booking_id: string; booking_type: string; pnr: string | null; our_status: string
  tbo_ticket_status: number | null; provider_status: string | null
  flagged_at: string; resolved: boolean
}

const TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', cab: 'Cab', multicity: 'Multicity',
  flightseva: 'FlightSeva', kafila: 'Kafila', fareguide: 'FareGuide', nexus: 'Nexus', airiq: 'AirIQ',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PnrHealthPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  function load() {
    setLoading(true); setError(''); setPermissionDenied(false)
    adminFetch('/api/admin/super/pnr-health')
      .then(d => setFlags(d.flags ?? []))
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function resolve(id: string) {
    setResolvingId(id)
    await adminFetch(`/api/admin/super/pnr-health/${id}`, { method: 'PATCH' }).catch(() => {})
    setResolvingId(null)
    load()
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>PNR Health</h2>
        <span className="topbar-meta">Bookings the daily health checks found no longer confirmed at the provider — the airline/supplier may have cancelled independently</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">{flags.length} Flagged Booking{flags.length === 1 ? '' : 's'}</div>
                <div className="card-copy">Covers flight, hotel, cab, multicity (both TekTravels and FlightSeva legs), and the fixed-flight providers (kafila/fareguide/nexus/airiq). AirIQ bookings made before its channel-tracking column existed are skipped — see the cron route for why.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Flagged</th><th>Type</th><th>PNR</th><th>Our Status</th><th>Provider Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="empty-state">{permissionDenied ? <PermissionDenied message={error} /> : <span style={{ color: '#DC2626' }}>{error}</span>}</td></tr>
                ) : flags.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No flagged bookings.</td></tr>
                ) : flags.map(f => (
                  <tr key={f.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(f.flagged_at)}</td>
                    <td><span className="badge badge-yellow">{TYPE_LABELS[f.booking_type] ?? f.booking_type}</span></td>
                    <td><code style={{ fontSize: 11 }}>{f.pnr ?? '--'}</code></td>
                    <td>{f.our_status}</td>
                    <td style={{ maxWidth: 320, fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.tbo_ticket_status != null ? `Code ${f.tbo_ticket_status}` : (f.provider_status ?? '--')}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" disabled={resolvingId === f.id} onClick={() => resolve(f.id)}>
                        Mark Resolved
                      </button>
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
