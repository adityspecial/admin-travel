'use client'

export interface ApprovalTier { maxAmount: number | null; approval: string }

const SEL = { flex: 1, padding: '7px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, background: '#fff' }
const AMT = { width: 120, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const }

// Ordered list of { upTo amount, who approves } — the last tier always has
// maxAmount: null (no upper bound). Replaces a flat in/out-of-policy switch
// with proper budget tiering (e.g. auto-approve under ₹10k, manager
// ₹10k–50k, HOD above ₹50k).
export function ApprovalTiersEditor({ tiers, onChange }: { tiers: ApprovalTier[]; onChange: (t: ApprovalTier[]) => void }) {
  function updateTier(i: number, patch: Partial<ApprovalTier>) {
    onChange(tiers.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  }
  function addTier() {
    const last = tiers[tiers.length - 1]
    const prevMax = tiers.length > 1 ? (tiers[tiers.length - 2].maxAmount ?? 0) : 0
    onChange([...tiers.slice(0, -1), { maxAmount: prevMax + 10000, approval: last.approval }, last])
  }
  function removeTier(i: number) {
    if (tiers.length <= 1) return
    onChange(tiers.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      {tiers.map((t, i) => {
        const isLast  = i === tiers.length - 1
        const prevMax = i > 0 ? tiers[i - 1].maxAmount : 0
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#6B7280', minWidth: 76, flexShrink: 0 }}>
              {i === 0 ? 'Up to ₹' : `₹${(prevMax ?? 0).toLocaleString('en-IN')} – ${isLast ? 'above' : ''}`}
            </span>
            {isLast ? (
              <span style={{ flexShrink: 0, width: 120 }} />
            ) : (
              <input type="number" min={0} value={t.maxAmount ?? ''} style={AMT}
                onChange={e => updateTier(i, { maxAmount: Number(e.target.value) || 0 })} />
            )}
            <select value={t.approval} style={SEL} onChange={e => updateTier(i, { approval: e.target.value })}>
              <option value="none">No Approval Required</option>
              <option value="manager">Manager Approval</option>
              <option value="hod">HOD Approval</option>
            </select>
            {tiers.length > 1 && (
              <button onClick={() => removeTier(i)} title="Remove tier"
                style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>
                ×
              </button>
            )}
          </div>
        )
      })}
      <button onClick={addTier}
        style={{ marginTop: 4, padding: '6px 14px', borderRadius: 6, border: '1.5px dashed #CBD5E1', background: 'none', color: '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        + Add Tier
      </button>
    </div>
  )
}
