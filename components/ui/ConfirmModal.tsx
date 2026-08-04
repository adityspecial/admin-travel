import React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import './ConfirmModal.css'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning' | 'success'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const IconComponent = tone === 'success' ? CheckCircle2 : AlertTriangle

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-head">
          <div className={`confirm-modal-icon-box confirm-modal-icon-${tone}`}>
            <IconComponent size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h4 className="confirm-modal-title">{title}</h4>
            <div className="confirm-modal-message">{message}</div>
          </div>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn confirm-modal-btn-${tone}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Updating…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
