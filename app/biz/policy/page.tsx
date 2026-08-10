'use client'

import React, { useState } from 'react'
import { FlightPolicy } from './FlightPolicy'
import { InsurancePolicy } from './InsurancePolicy'
import { EligibilityPolicy } from './EligibilityPolicy'
import { SimpleCapPolicy } from './SimpleCapPolicy'
import './policy.css'
import {
  ShieldCheck,
  Plane,
  Hotel,
  Car,
  Bus,
  Train,
  FileText,
  Gift,
  Globe,
  Shield,
  Package,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Clock,
} from 'lucide-react'

const TYPES = [
  { key: 'domestic_flight', label: 'Flight Policy', icon: Plane },
  { key: 'hotel', label: 'Hotel Policy', icon: Hotel },
  { key: 'cab', label: 'Cab Services', icon: Car },
  { key: 'bus', label: 'Bus Travel', icon: Bus },
  { key: 'train', label: 'Train Journeys', icon: Train },
  { key: 'rental_cab', label: 'Rental Cabs', icon: Car },
  { key: 'travel_request_form', label: 'Request Form', icon: FileText },
  { key: 'gift_cards', label: 'Gift Cards', icon: Gift },
  { key: 'visa', label: 'Visa Concierge', icon: Globe },
  // Missing from origin/test's redesign (never added there) — the render
  // logic below already has a working sel === 'package' branch (SimpleCapPolicy),
  // it just had no sidebar entry to reach it. Restored, no color/bg (unused —
  // this file's own sidebar rendering keys color entirely off
  // `pp-item-icon--${t.key}` CSS classes, not per-type fields).
  { key: 'package', label: 'Packages', icon: Package },
  { key: 'insurance', label: 'Travel Insurance', icon: Shield },
]

// Everything that renders a real settings editor below (not the "Coming
// Soon" placeholder) belongs here — drives both the sidebar LIVE/SOON badge
// and the "Active Policy"/"Under Development" status. visa/package route to
// SimpleCapPolicy (cap + buffer), which is genuinely saved and enforced.
const LIVE = new Set(['domestic_flight', 'hotel', 'cab', 'insurance', 'visa', 'package'])

export default function PolicyPage() {
  const [sel, setSel] = useState('domestic_flight')
  const [showMobileNav, setShowMobileNav] = useState(false)

  const selectedCategory = TYPES.find((t) => t.key === sel)

  return (
    <div className="pp-page">
      <div className="policy-wrapper">
        {/* Left Category Sidebar */}
        <aside className={`policy-sidebar ${showMobileNav ? 'policy-sidebar--mobile-open' : ''}`}>
          <div className="pp-sidebar-heading">
            <Sliders size={16} color="var(--accent, #E31E24)" /> POLICY CATEGORIES
          </div>

          <div className="pp-items-list">
            {TYPES.map((t) => {
              const isSelected = sel === t.key
              const isLive = LIVE.has(t.key)
              const IconComp = t.icon

              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setSel(t.key)
                    setShowMobileNav(false)
                  }}
                  className={`policy-item-btn ${isSelected ? 'active' : ''}`}
                >
                  <div className="pp-item-left">
                    <div
                      className={`pp-item-icon pp-item-icon--${t.key} ${isSelected ? 'pp-item-icon--selected' : ''}`}
                    >
                      <IconComp size={16} />
                    </div>
                    <span className={`pp-item-label ${isSelected ? 'pp-item-label--selected' : ''}`}>
                      {t.label}
                    </span>
                  </div>

                  {isLive ? (
                    <span className="pp-badge-live">
                      LIVE
                    </span>
                  ) : (
                    <span className="pp-badge-soon">
                      SOON
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="policy-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div className="pp-breadcrumb-row">
            <div className="pp-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="pp-breadcrumb-active">Corporate Travel Policy & Governance</span>
            </div>

            <button onClick={() => setShowMobileNav((v) => !v)} className="btn-secondary mobile-nav-toggle">
              <Sliders size={14} /> {showMobileNav ? 'Hide Categories' : 'Select Category'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="pp-hero-glow" />

            <div className="pp-hero-content">
              <div className="pp-hero-left">
                <div className="pp-hero-icon">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h1 className="pp-hero-title">
                    Corporate Travel Policy Engine <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="pp-hero-subtitle">
                    Configure spend limits, multi-tier approval workflows, dynamic pricing restrictions, and cabin allowances.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div className="pp-hero-metrics">
              <div>
                <div className="pp-metric-label">Active Category</div>
                <div className="pp-metric-value pp-metric-value--category">
                  {selectedCategory?.label}
                </div>
              </div>
              <div>
                <div className="pp-metric-label">Policy Status</div>
                <div className="pp-metric-value pp-metric-value--status">
                  {LIVE.has(sel) ? 'Active Policy' : 'Under Development'}
                </div>
              </div>
              <div>
                <div className="pp-metric-label">Approval Escalation</div>
                <div className="pp-metric-value pp-metric-value--escalation">
                  Multi-Tier Tiers
                </div>
              </div>
            </div>
          </div>

          {/* Policy Settings Content Editor */}
          <div>
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
              <div className="pp-soon-box">
                <div className="pp-soon-emoji">🚧</div>
                <h3 className="pp-soon-title">Category Policy Coming Soon</h3>
                <p className="pp-soon-desc">
                  {selectedCategory?.label} governance rules and spending limits will be configurable in the upcoming release.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
