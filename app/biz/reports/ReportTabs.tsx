function fmt(n: number) {
  if (n === 0) return '₹0'
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`
  return `₹${n.toLocaleString('en-IN')}`
}

function pct(part: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

type Tab = 'overview' | 'dept' | 'employee' | 'cost-center' | 'gst'

interface ReportData {
  summary: { totalSpend: number; totalBookings: number }
  gst: { totalWithGst: number; baseAmount: number; gstAmount: number }
  byDept:       { dept: string; count: number; spend: number }[]
  byType:       { booking_type: string; count: number; spend: number }[]
  byEmployee:   { email: string; count: number; spend: number }[]
  byCostCenter: { name: string; code: string; count: number; spend: number }[]
  monthly:      { month: string; count: number; spend: number }[]
}

export function ReportTabs({ data, tab, setTab, loading }: {
  data: ReportData | null
  tab: Tab
  setTab: (t: Tab) => void
  loading: boolean
}) {
  const s = data?.summary
  const g = data?.gst

  return (
    <div className="rpt-card">
      <div className="rpt-tabs-row">
        {(['overview','dept','employee','cost-center','gst'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rpt-tab-btn ${tab === t ? 'rpt-tab-btn--active' : ''}`}>
            {t === 'cost-center' ? 'Cost Centers' : t === 'gst' ? 'GST' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="rpt-body">
        {loading && <div className="rpt-loading">Loading…</div>}

        {!loading && data && tab === 'overview' && (
          data.monthly.length === 0
            ? <div className="rpt-empty">No data for this period.</div>
            : (
              <div className="rpt-chart-wrap">
                {data.monthly.map((m, i) => {
                  const max = Math.max(...data.monthly.map(x => x.spend), 1)
                  return (
                    <div key={i} className="rpt-bar-col">
                      <div className="rpt-bar-value">{fmt(m.spend)}</div>
                      <div className="rpt-bar" style={{ height: Math.max((m.spend/max)*120, 4) }} />
                      <div className="rpt-bar-month">{m.month.slice(5)}</div>
                    </div>
                  )
                })}
              </div>
            )
        )}

        {!loading && data && tab === 'dept' && (
          <SimpleTable
            headers={['Dept','Bookings','Spend','Share']}
            empty={data.byDept.length === 0}
            rows={data.byDept.map(d => [d.dept??'Unassigned', d.count, fmt(d.spend), pct(d.spend, s?.totalSpend??1)])}
          />
        )}

        {!loading && data && tab === 'employee' && (
          <SimpleTable
            headers={['Employee','Bookings','Total Spend','Avg/Trip']}
            empty={data.byEmployee.length === 0}
            rows={data.byEmployee.map(e => [e.email, e.count, fmt(e.spend), fmt(Math.round(e.spend/e.count))])}
          />
        )}

        {!loading && data && tab === 'cost-center' && (
          <SimpleTable
            headers={['Code','Name','Bookings','Spend','Share']}
            empty={data.byCostCenter.length === 0}
            rows={data.byCostCenter.map(c => [c.code, c.name, c.count, fmt(c.spend), pct(c.spend, s?.totalSpend??1)])}
          />
        )}

        {!loading && data && tab === 'gst' && g && (
          <div>
            <div className="rpt-gst-grid">
              {[
                ['Total Invoiced', fmt(g.totalWithGst), 'incl. 18% GST'],
                ['Base Amount',   fmt(g.baseAmount),   'excl. GST'],
                ['GST (18%)',     fmt(g.gstAmount),    'input credit eligible'],
              ].map(([l,v,sub]) => (
                <div key={String(l)} className="rpt-gst-card">
                  <div className="rpt-gst-card-label">{l}</div>
                  <div className="rpt-gst-card-value">{v}</div>
                  <div className="rpt-gst-card-sub">{sub}</div>
                </div>
              ))}
            </div>
            <SimpleTable
              headers={['Type','Bookings','Total (incl. GST)','Base (excl. GST)','GST Amount']}
              empty={data.byType.length === 0}
              rows={data.byType.map(t => {
                const base = Math.round(t.spend/1.18)
                return [t.booking_type, t.count, fmt(t.spend), fmt(base), fmt(t.spend-base)]
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function SimpleTable({ headers, rows, empty }: { headers: string[]; rows: (string|number)[][]; empty: boolean }) {
  return (
    <table className="rpt-table">
      <thead>
        <tr className="rpt-thead-row">
          {headers.map(h => <th key={h} className="rpt-th">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {empty
          ? <tr><td colSpan={headers.length} className="rpt-empty-td">No data.</td></tr>
          : rows.map((row, i) => (
            <tr key={i} className="rpt-tr">
              {row.map((cell, j) => (
                <td key={j} className={`rpt-td ${j === 0 ? 'rpt-td--first' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  )
}
