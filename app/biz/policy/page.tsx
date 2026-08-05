'use client'

import React, { useState } from 'react'
import { FlightPolicy } from './FlightPolicy'
import { InsurancePolicy } from './InsurancePolicy'
import { EligibilityPolicy } from './EligibilityPolicy'
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
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Clock,
} from 'lucide-react'

const TYPES = [
  { key: 'domestic_flight', label: 'Flight Policy', icon: Plane, color: '#2563EB', bg: '#EFF6FF' },
  { key: 'hotel', label: 'Hotel Policy', icon: Hotel, color: '#047857', bg: '#ECFDF5' },
  { key: 'cab', label: 'Cab Services', icon: Car, color: '#D97706', bg: '#FFFBEB' },
  { key: 'bus', label: 'Bus Travel', icon: Bus, color: '#DC2626', bg: '#FEF2F2' },
  { key: 'train', label: 'Train Journeys', icon: Train, color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'rental_cab', label: 'Rental Cabs', icon: Car, color: '#0284C7', bg: '#F0F9FF' },
  { key: 'travel_request_form', label: 'Request Form', icon: FileText, color: '#4B5563', bg: '#F3F4F6' },
  { key: 'gift_cards', label: 'Gift Cards', icon: Gift, color: '#DB2777', bg: '#FDF2F8' },
  { key: 'visa', label: 'Visa Concierge', icon: Globe, color: '#059669', bg: '#ECFDF5' },
  { key: 'insurance', label: 'Travel Insurance', icon: Shield, color: '#9333EA', bg: '#FAF5FF' },
]

const LIVE = new Set(['domestic_flight', 'hotel', 'cab', 'insurance'])

export default function PolicyPage() {
  const [sel, setSel] = useState('domestic_flight')
  const [showMobileNav, setShowMobileNav] = useState(false)

  const selectedCategory = TYPES.find((t) => t.key === sel)

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .policy-wrapper {
          display: flex;
          min-height: calc(100vh - 54px);
        }
        .policy-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
          border-right: 1px solid #E5E7EB;
          padding: 24px 16px;
          overflow-y: auto;
          position: sticky;
          top: 54px;
          height: calc(100vh - 54px);
        }
        .policy-main {
          flex: 1;
          padding: 32px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }
        .hero-banner-box {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
          border-radius: 24px;
          padding: 32px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 36px -10px rgba(49, 46, 129, 0.25);
        }
        .policy-item-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 6px;
        }
        .policy-item-btn:hover {
          background: #F3F4F6;
        }
        .policy-item-btn.active {
          background: #FEF2F2;
          border-color: #FCA5A5;
          box-shadow: 0 4px 12px rgba(227, 30, 36, 0.08);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        .mobile-nav-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .policy-wrapper {
            flex-direction: column;
          }
          .policy-sidebar {
            width: 100%;
            position: relative;
            top: 0;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #E5E7EB;
            display: ${showMobileNav ? 'block' : 'none'};
          }
          .mobile-nav-toggle {
            display: inline-flex;
          }
          .policy-main {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .policy-main {
            padding: 14px 10px 28px;
          }
        }
      `}</style>

      <div className="policy-wrapper">
        {/* Left Category Sidebar */}
        <aside className="policy-sidebar">
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#111827', letterSpacing: '0.06em', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--accent, #E31E24)" /> POLICY CATEGORIES
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '9px',
                        background: isSelected ? 'var(--accent, #E31E24)' : t.bg,
                        color: isSelected ? '#ffffff' : t.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <IconComp size={16} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--accent, #E31E24)' : '#374151' }}>
                      {t.label}
                    </span>
                  </div>

                  {isLive ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                      LIVE
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Corporate Travel Policy & Governance</span>
            </div>

            <button onClick={() => setShowMobileNav((v) => !v)} className="btn-secondary mobile-nav-toggle">
              <Sliders size={14} /> {showMobileNav ? 'Hide Categories' : 'Select Category'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(227, 30, 36, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Corporate Travel Policy Engine <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Configure spend limits, multi-tier approval workflows, dynamic pricing restrictions, and cabin allowances.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Active Category</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                  {selectedCategory?.label}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Policy Status</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  {LIVE.has(sel) ? 'Active Policy' : 'Under Development'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Approval Escalation</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
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
            ) : LIVE.has(sel) ? (
              <FlightPolicy key={sel} type={sel} />
            ) : (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '64px 24px',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚧</div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>Category Policy Coming Soon</h3>
                <p style={{ fontSize: '13.5px', color: '#6B7280', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0' }}>
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
