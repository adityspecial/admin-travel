'use client'

export interface ApprovalTier { maxAmount: number | null; approval: string }

// Ordered list of { upTo amount, who approves } — the last tier always has
// maxAmount: null (no upper bound). Replaces a flat in/out-of-policy switch
// with proper budget tiering (e.g. auto-approve under ₹10k, manager
// ₹10k–50k, HOD above ₹50k).
//
// tier[0]'s amount is always the org's live cap (from the Caps page), not an
// independently-editable number — resolveApproval() overrides it at
// evaluation time regardless of what's stored, so letting it be edited here
// would silently do nothing once saved. Only its approval level (who signs
// off on in-policy bookings) is actually editable.
export function ApprovalTiersEditor({ tiers, onChange, baseCap }: { tiers: ApprovalTier[]; onChange: (t: ApprovalTier[]) => void; baseCap: number | null }) {
  function updateTier(i: number, patch: Partial<ApprovalTier>) {
    onChange(tiers.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  }
  function addTier() {
    const last = tiers[tiers.length - 1]
    // Reference point for a brand-new tier's starting amount: the previous
    // tier's boundary, or baseCap when that previous tier IS tier[0] (whose
    // stored maxAmount is no longer authoritative — see the note above).
    const prevMax = tiers.length > 2 ? (tiers[tiers.length - 2].maxAmount ?? 0) : (baseCap ?? 0)
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
        // The tier just below this one — tier[0]'s stored maxAmount isn't
        // authoritative (baseCap is), so use baseCap as the label boundary
        // when referencing tier[0] specifically.
        const prevMax = i > 1 ? tiers[i - 1].maxAmount : i === 1 ? baseCap : 0
        return (
          <div key={i} className="pol-tier-row">
            <span className="pol-tier-label">
              {i === 0 ? 'Up to' : `₹${(prevMax ?? 0).toLocaleString('en-IN')} – ${isLast ? 'above' : ''}`}
            </span>
            {isLast ? (
              <span className="pol-tier-spacer" />
            ) : i === 0 ? (
              <span
                className="pol-tier-amount"
                style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', color: '#6B7280', border: '1.5px dashed #E5E7EB' }}
                title="Set on the Caps page — the same value used for the flat cap."
              >
                {baseCap != null ? `₹${baseCap.toLocaleString('en-IN')}` : 'No cap set'}
              </span>
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
