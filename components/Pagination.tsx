'use client'
import { useMemo, useState } from 'react'

interface Props {
  total:   number
  page:    number
  perPage: number
  onPage:  (p: number) => void
}

export function Pagination({ total, page, perPage, onPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const pages = useMemo<(number | '…')[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const out: (number | '…')[] = [1]
    if (page > 3) out.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) out.push(p)
    if (page < totalPages - 2) out.push('…')
    out.push(totalPages)
    return out
  }, [totalPages, page])

  if (totalPages <= 1) return null

  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', background: 'var(--surface)', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
        Showing <strong>{from}–{to}</strong> of <strong>{total.toLocaleString('en-IN')}</strong>
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <PageBtn label="‹" title="Previous" disabled={page === 1}         onClick={() => onPage(page - 1)} />
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} style={{ padding: '5px 6px', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1 }}>…</span>
            : <PageBtn key={p} label={String(p)} active={p === page} onClick={() => onPage(p as number)} />
        )}
        <PageBtn label="›" title="Next" disabled={page === totalPages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  )
}

function PageBtn({ label, title, active, disabled, onClick }: { label: string; title?: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '5px 10px', borderRadius: 7, fontSize: 13, fontWeight: active ? 700 : 500,
        background:  active ? 'var(--accent)' : 'transparent',
        color:       active ? '#fff' : disabled ? 'var(--ink-4)' : 'var(--ink-2)',
        borderWidth: 1, borderStyle: 'solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        cursor:      disabled ? 'not-allowed' : 'pointer',
        minWidth:    32, textAlign: 'center',
      }}
    >
      {label}
    </button>
  )
}

/** Hook: client-side pagination over a local array. Resets to page 1 when `items` reference changes. */
export function usePagination<T>(items: T[], perPage = 20) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const safePage   = Math.min(page, totalPages)
  const slice      = items.slice((safePage - 1) * perPage, safePage * perPage)

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  return { page: safePage, setPage: goTo, slice, total: items.length, totalPages }
}
