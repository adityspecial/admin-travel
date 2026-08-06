'use client'

export interface ApprovalTier { maxAmount: number | null; approval: string }

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
          <div key={i} className="pol-tier-row">
            <span className="pol-tier-label">
              {i === 0 ? 'Up to ₹' : `₹${(prevMax ?? 0).toLocaleString('en-IN')} – ${isLast ? 'above' : ''}`}
            </span>
            {isLast ? (
              <span className="pol-tier-spacer" />
            ) : (
              <input type="number" min={0} value={t.maxAmount ?? ''} className="pol-tier-amount"
                onChange={e => updateTier(i, { maxAmount: Number(e.target.value) || 0 })} />
            )}
            <select value={t.approval} className="pol-tier-select" onChange={e => updateTier(i, { approval: e.target.value })}>
              <option value="none">No Approval Required</option>
              <option value="manager">Manager Approval</option>
              <option value="hod">HOD Approval</option>
            </select>
            {tiers.length > 1 && (
              <button onClick={() => removeTier(i)} title="Remove tier"
                className="pol-tier-remove-btn">
                ×
              </button>
            )}
          </div>
        )
      })}
      <button onClick={addTier}
        className="pol-tier-add-btn">
        + Add Tier
      </button>
    </div>
  )
}
