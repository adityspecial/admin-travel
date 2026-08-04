import React from 'react'
import { X, ExternalLink } from 'lucide-react'
import './AppImageModal.css'

export interface AppImageModalProps {
  isOpen: boolean
  src: string | null
  alt?: string
  title?: string
  subtitle?: string
  onClose: () => void
}

export function AppImageModal({
  isOpen,
  src,
  alt = 'Image preview',
  title = 'Image Preview',
  subtitle,
  onClose,
}: AppImageModalProps) {
  if (!isOpen || !src) return null

  return (
    <div className="app-image-modal-overlay" onClick={onClose}>
      <div className="app-image-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="app-image-modal-header">
          <div>
            <h3 className="app-image-modal-title">{title}</h3>
            {subtitle && <p className="app-image-modal-subtitle">{subtitle}</p>}
          </div>

          <div className="app-image-modal-actions">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="app-image-modal-btn"
              title="Open full image in new tab"
            >
              <ExternalLink size={14} />
              <span>Open Original</span>
            </a>
            <button
              type="button"
              className="app-image-modal-close-btn"
              onClick={onClose}
              aria-label="Close image preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="app-image-modal-body">
          <img src={src} alt={alt} className="app-image-modal-img" />
        </div>
      </div>
    </div>
  )
}
