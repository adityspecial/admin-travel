'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface ProviderError {
  id: string; provider: string; endpoint: string | null
  error_message: string; error_code: string | null
  context: Record<string, unknown> | null; created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ProviderErrorsPage() {
  const [errors, setErrors] = useState<ProviderError[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('')
  const [days, setDays] = useState('7')

  function load() {
    setLoading(true); setError('')
    const qs = new URLSearchParams({ days })
    if (provider) qs.set('provider', provider)
    adminFetch(`/api/admin/super/provider-errors?${qs.toString()}`)
      .then(d => setErrors(d.errors ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div>
      <div className="admin-topbar">
        <h2>Provider API Errors</h2>
        <span className="topbar-meta">Transport-level failures across every provider — timeouts, non-2xx, malformed/rejected responses</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Filters</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Provider
                <select value={provider} onChange={e => setProvider(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="">All</option>
                  <option value="tektravels">TekTravels / TBO</option>
                  <option value="flightseva">FlightSeva</option>
                  <option value="gozo">Gozo (Cab)</option>
                  <option value="kafila">Kafila</option>
                  <option value="fareguide">FareGuide</option>
                  <option value="nexus">Nexus</option>
                  <option value="airiq">AirIQ</option>
                  <option value="asego">ASEGO (Insurance)</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Period
                <select value={days} onChange={e => setDays(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
              </label>
              <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
            </div>
          </section>

          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Errors</div>
                <div className="card-copy">Most recent first. Covers timeouts, non-2xx HTTP, and malformed responses — not "HTTP 200 with a business error" (checked per call site).</div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Time</th><th>Provider</th><th>Endpoint</th><th>Error</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={4} className="empty-state" style={{ color: '#DC2626' }}>{error}</td></tr>
                ) : errors.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">No provider errors in this period.</td></tr>
                ) : errors.map(e => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.created_at)}</td>
                    <td><span className="badge badge-yellow">{e.provider}</span></td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#6B7280' }}>{e.endpoint ?? '--'}</td>
                    <td style={{ maxWidth: 420, color: '#374151', fontSize: 12 }}>{e.error_message}</td>
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
