import React from 'react'
import { LucideIcon } from 'lucide-react'
import './StatCard.css'

export interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  badge?: string
  Icon: LucideIcon
  iconBg?: string
  iconColor?: string
  badgeBg?: string
  badgeColor?: string
  className?: string
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  sub,
  badge,
  Icon,
  iconBg = '#eff6ff',
  iconColor = '#2563eb',
  badgeBg = '#dbeafe',
  badgeColor = '#1d4ed8',
  className = '',
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`stat-card-lucrative ${onClick ? 'clickable' : ''} ${className}`.trim()}
    >
      {/* Top decorative accent stripe */}
      <div
        className="stat-card-accent-stripe"
        style={{ backgroundColor: iconColor }}
      />

      <div className="stat-card-head">
        <div
          className="stat-card-icon-box"
          style={{
            backgroundColor: iconBg,
            color: iconColor,
            boxShadow: `0 2px 8px ${iconColor}20`,
          }}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
        {badge && (
          <span
            className="stat-card-badge"
            style={{
              backgroundColor: badgeBg,
              color: badgeColor,
            }}
          >
            <span
              className="stat-card-badge-dot"
              style={{ backgroundColor: badgeColor }}
            />
            {badge}
          </span>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  )
}
