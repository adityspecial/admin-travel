'use client'

import React from 'react'
import Link from 'next/link'
import {
  Users,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Sparkles,
  UserPlus,
  Sliders,
  CreditCard,
  ChevronRight,
} from 'lucide-react'

interface HeroSectionProps {
  companyName?: string
  walletBalance?: number
}

export default function HeroSection({ companyName, walletBalance }: HeroSectionProps) {
  const cards = [
    {
      id: 'workforce',
      title: 'Employee Management',
      subtitle: 'Add employees, organize teams & set departmental savings policies.',
      cta: 'INVITE EMPLOYEES',
      href: '/biz/members',
      icon: Users,
      badgeIcon: UserPlus,
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      accentColor: '#2563EB',
      lightBg: '#EFF6FF',
      highlight: 'Manage Employees',
    },
    {
      id: 'policy',
      title: 'Policy & Compliance',
      subtitle: 'Customize flight & hotel caps, auto-approvals & booking rules.',
      cta: 'CONFIGURE POLICY',
      href: '/biz/policy',
      icon: ShieldCheck,
      badgeIcon: Sliders,
      gradient: 'linear-gradient(135deg, var(--accent, #E31E24) 0%, #B91C1C 100%)',
      accentColor: 'var(--accent, #E31E24)',
      lightBg: '#FEF2F2',
      highlight: 'Set Limits',
    },
    {
      id: 'wallet',
      title: 'Corporate Wallet',
      subtitle: 'Instant wallet top-up for seamless employee travel bookings.',
      cta: 'RECHARGE WALLET',
      href: '/biz/wallet',
      icon: Wallet,
      badgeIcon: CreditCard,
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      accentColor: '#059669',
      lightBg: '#ECFDF5',
      highlight: walletBalance !== undefined ? `₹${walletBalance.toLocaleString('en-IN')}` : 'Quick Top-up',
    },
  ]

  return (
    <div
      className="hero-section-wrapper"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 35%, #FFE4E6 70%, #FEF3C7 100%)',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(229, 231, 235, 0.6)',
      }}
    >
      <style>{`
        .hero-section-wrapper {
          padding: 36px 36px 32px;
        }
        .hero-title {
          font-size: var(--fs-section-heading);
        }
        .hero-cards-grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        @media (max-width: 1024px) {
          .hero-section-wrapper {
            padding: 28px 24px 24px;
          }
          .hero-title {
            font-size: var(--fs-section-heading);
          }
        }
        @media (max-width: 640px) {
          .hero-section-wrapper {
            padding: 20px 14px 20px;
          }
          .hero-title {
            font-size: var(--fs-card-title);
          }
          .hero-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-40px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(227, 30, 36, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '10%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1400, margin: '0 auto' }}>
        {/* Top Header / Breadcrumb Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Breadcrumb Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#4B5563',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <span>Admin</span>
            <ChevronRight size={13} color="#9CA3AF" />
            <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Performance Dashboard</span>
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '99px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#047857',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <span>Corporate Live Console</span>
          </div>
        </div>

        {/* Welcome Greeting */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            className="hero-title"
            style={{
              fontWeight: 900,
              color: '#111827',
              letterSpacing: '-0.03em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Hello {companyName || 'Admin'} <Sparkles size={22} color="#F59E0B" />
          </h1>
          <p style={{ fontSize: '14px', color: '#4B5563', marginTop: '6px', marginBottom: 0, fontWeight: 500 }}>
            Welcome to the <strong>Corporate Admin Console</strong>. Empower your organization with seamless travel management, policy enforcement, and wallet controls.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div
          className="hero-cards-grid"
          style={{
            display: 'grid',
            gap: '20px',
          }}
        >
          {cards.map((card) => {
            const Icon = card.icon
            const BadgeIcon = card.badgeIcon

            return (
              <div
                key={card.id}
                style={{
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.95)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.borderColor = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <div>
                  {/* Top Card Icon & Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '18px',
                    }}
                  >
                    {/* Gradient Icon Badge */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: card.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: `0 8px 18px -4px ${card.accentColor}55`,
                      }}
                    >
                      <Icon size={24} strokeWidth={2.2} />
                    </div>

                    {/* Secondary Highlight Chip */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '99px',
                        background: card.lightBg,
                        color: card.accentColor,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                      }}
                    >
                      <BadgeIcon size={13} />
                      <span>{card.highlight}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#111827',
                      marginBottom: '8px',
                      lineHeight: 1.3,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      lineHeight: 1.55,
                      margin: 0,
                      marginBottom: '20px',
                    }}
                  >
                    {card.subtitle}
                  </p>
                </div>

                {/* Bottom CTA Link */}
                <Link
                  href={card.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    background: card.lightBg,
                    color: card.accentColor,
                    fontSize: '12.5px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = card.accentColor
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = card.lightBg
                    e.currentTarget.style.color = card.accentColor
                  }}
                >
                  <span>{card.cta}</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
