import React from 'react'
import { X } from 'lucide-react'
import './AppPopup.css'

export interface AppPopupProps {
  isOpen: boolean
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  iconTone?: 'blue' | 'teal' | 'orange' | 'violet' | 'danger'
  maxWidth?: string | number
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AppPopup({
  isOpen,
  title,
  subtitle,
  icon,
  iconTone = 'blue',
  maxWidth = 520,
  onClose,
  children,
  footer,
  className = '',
}: AppPopupProps) {
  if (!isOpen) return null

  return (
    <div className="app-popup-overlay" onClick={onClose}>
      <div
        className={`app-popup-box ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-popup-header">
          <div className="app-popup-title-group">
            {icon && (
              <div className={`app-popup-icon-box app-popup-icon-${iconTone}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="app-popup-title">{title}</h3>
              {subtitle && <p className="app-popup-subtitle">{subtitle}</p>}
            </div>
          </div>

          <button type="button" className="app-popup-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="app-popup-body">{children}</div>

        {footer && <div className="app-popup-footer">{footer}</div>}
      </div>
    </div>
  )
}
