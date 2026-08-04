'use client'
import { useState } from 'react'
import { FlightPolicy } from './FlightPolicy'
import { InsurancePolicy } from './InsurancePolicy'
import { EligibilityPolicy } from './EligibilityPolicy'
import { SimpleCapPolicy } from './SimpleCapPolicy'

const TYPES = [
  { key: 'domestic_flight',      label: 'Flights',                icon: '✈️' },
  { key: 'hotel',                label: 'Hotels',                icon: '🏨' },
  { key: 'cab',                  label: 'Cabs',                  icon: '🚖' },
  { key: 'bus',                  label: 'Bus',                   icon: '🚌' },
  { key: 'train',                label: 'Train',                 icon: '🚂' },
  { key: 'rental_cab',           label: 'Rental Cabs',           icon: '🚗' },
  { key: 'travel_request_form',  label: 'Travel Request Form',   icon: '📋' },
  { key: 'gift_cards',           label: 'Gift Cards',            icon: '🎁' },
  { key: 'visa',                 label: 'Visa',                  icon: '🪪' },
  { key: 'package',              label: 'Packages',              icon: '📦' },
  { key: 'insurance',            label: 'Insurance',             icon: '🛡️' },
]

const LIVE = new Set(['domestic_flight', 'hotel', 'cab', 'insurance'])

export default function PolicyPage() {
  const [sel, setSel] = useState('domestic_flight')

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB',
        padding: '20px 0', position: 'sticky', top: 54,
        height: 'calc(100vh - 54px)', overflowY: 'auto' as const,
      }}>
        <div style={{ padding: '0 16px 12px', fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.08em' }}>POLICY</div>
        {TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => setSel(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '11px 16px', background: sel === t.key ? '#FFF5F5' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left' as const,
              borderLeft: sel === t.key ? '3px solid #E31E24' : '3px solid transparent',
              color: sel === t.key ? '#E31E24' : '#374151',
              fontWeight: sel === t.key ? 700 : 500, fontSize: 13,
            }}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' as const }}>
        {sel === 'insurance' ? (
          <InsurancePolicy />
        ) : sel === 'hotel' ? (
          <EligibilityPolicy key={sel} type="hotel" title="Hotel" />
        ) : sel === 'cab' ? (
          <EligibilityPolicy key={sel} type="cab" title="Cab" />
        ) : sel === 'visa' ? (
          <SimpleCapPolicy key={sel} capField="visaCap" bufferField="visaCapBuffer" title="Visa" unit="per application" />
        ) : sel === 'package' ? (
          <SimpleCapPolicy key={sel} capField="packageCap" bufferField="packageCapBuffer" title="Package" unit="per booking" />
        ) : LIVE.has(sel) ? (
          <FlightPolicy key={sel} type={sel} />
        ) : (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            padding: '64px', textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Coming Soon</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
              {TYPES.find(t => t.key === sel)?.label} policy settings will be available soon.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
