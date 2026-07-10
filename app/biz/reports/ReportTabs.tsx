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
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
        {(['overview','dept','employee','cost-center','gst'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t ? 700 : 500,
            color: tab === t ? '#E31E24' : '#6B7280',
            borderBottom: tab === t ? '2px solid #E31E24' : '2px solid transparent',
          }}>
            {t === 'cost-center' ? 'Cost Centers' : t === 'gst' ? 'GST' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>Loading…</div>}

        {!loading && data && tab === 'overview' && (
          data.monthly.length === 0
            ? <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>No data for this period.</div>
            : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
                {data.monthly.map((m, i) => {
                  const max = Math.max(...data.monthly.map(x => x.spend), 1)
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 10, color: '#6B7280' }}>{fmt(m.spend)}</div>
                      <div style={{ width: '70%', background: '#2563EB', borderRadius: '3px 3px 0 0', height: Math.max((m.spend/max)*120, 4) }} />
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{m.month.slice(5)}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              {[
                ['Total Invoiced', fmt(g.totalWithGst), 'incl. 18% GST'],
                ['Base Amount',   fmt(g.baseAmount),   'excl. GST'],
                ['GST (18%)',     fmt(g.gstAmount),    'input credit eligible'],
              ].map(([l,v,sub]) => (
                <div key={String(l)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e' }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{sub}</div>
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
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
          {headers.map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#9CA3AF' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {empty
          ? <tr><td colSpan={headers.length} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No data.</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid #F9FAFB' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 12px', fontSize: 13, fontWeight: j === 0 ? 700 : 400, color: j === 0 ? '#1a1a2e' : '#374151' }}>
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
