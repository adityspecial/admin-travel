'use client'
import { useEffect, useState } from 'react'
import { adminFetch, adminDownload } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface ByType { table: string; promoSpend: number; walletSpend: number }
interface Report {
  byType: ByType[]; totalPromoSpend: number; totalWalletSpend: number
  promoLedger: { issued: number; debited: number; expired: number }; periodDays: number
}

const TABLE_LABELS: Record<string, string> = {
  flight_bookings: 'Flight', hotel_bookings: 'Hotel', cab_bookings: 'Cab', bus_bookings: 'Bus',
}

function money(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN') }

export default function PromoBurnPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [days, setDays] = useState('30')

  function load() {
    setLoading(true); setError(''); setPermissionDenied(false)
    adminFetch(`/api/admin/super/reports/promo-burn?days=${days}`)
      .then(setReport)
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function exportCSV() {
    adminDownload(`/api/admin/super/reports/promo-burn/export?days=${days}`, `promo-burn-${days}d.csv`)
      .catch(e => setError(e.message ?? 'Export failed'))
  }

  const promoShare = report && (report.totalPromoSpend + report.totalWalletSpend) > 0
    ? (report.totalPromoSpend / (report.totalPromoSpend + report.totalWalletSpend)) * 100
    : 0

  return (
    <div>
      <div className="admin-topbar">
        <h2>Promo Cash Burn</h2>
        <span className="topbar-meta">myPartner promo credit consumed vs real wallet spend</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Period</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Days
                <select value={days} onChange={e => setDays(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </label>
              <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
              <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ CSV</button>
            </div>
          </section>

          {error ? (
            permissionDenied ? <section className="table-card"><PermissionDenied message={error} /></section> : <div style={{ color: '#DC2626', fontSize: 13 }}>{error}</div>
          ) : loading ? (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
          ) : report && (
            <>
              <section className="stat-grid">
                <div className="stat-card">
                  <div className="stat-head"><div className="stat-num">{money(report.totalPromoSpend)}</div></div>
                  <div className="stat-label">Promo Cash Spent</div>
                  <div className="stat-sub">Bookings paid with partner_promo</div>
                </div>
                <div className="stat-card">
                  <div className="stat-head"><div className="stat-num">{money(report.totalWalletSpend)}</div></div>
                  <div className="stat-label">Real Wallet Spent</div>
                  <div className="stat-sub">Bookings paid with partner_wallet</div>
                </div>
                <div className="stat-card teal">
                  <div className="stat-head"><div className="stat-num">{promoShare.toFixed(1)}%</div></div>
                  <div className="stat-label">Promo Share</div>
                  <div className="stat-sub">Of total spend across both wallets</div>
                </div>
                <div className="stat-card">
                  <div className="stat-head"><div className="stat-num">{money(report.promoLedger.issued)}</div></div>
                  <div className="stat-label">Promo Cash Issued</div>
                  <div className="stat-sub">Credited to agents this period</div>
                </div>
              </section>

              <div className="table-card">
                <div className="table-header">
                  <div>
                    <div className="card-title">Spend by Booking Type</div>
                    <div className="card-copy">Last {report.periodDays} days.</div>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr><th>Type</th><th>Promo Spend</th><th>Wallet Spend</th></tr>
                  </thead>
                  <tbody>
                    {report.byType.map(r => (
                      <tr key={r.table}>
                        <td>{TABLE_LABELS[r.table] ?? r.table}</td>
                        <td style={{ fontWeight: 800 }}>{money(r.promoSpend)}</td>
                        <td style={{ fontWeight: 800 }}>{money(r.walletSpend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
