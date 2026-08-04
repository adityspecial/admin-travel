import React, { forwardRef } from 'react'
import './AppInput.css'

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  wrapperClassName?: string
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      label,
      helperText,
      error,
      icon,
      rightIcon,
      wrapperClassName = '',
      className = '',
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={`app-input-group ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="app-input-label">
            <span>
              {label}
              {required && <span className="app-input-required">*</span>}
            </span>
          </label>
        )}

        <div className="app-input-box-wrapper">
          {icon && <div className="app-input-left-icon">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`app-input ${icon ? 'app-input-with-left-icon' : ''} ${
              rightIcon ? 'app-input-with-right-icon' : ''
            } ${error ? 'app-input-error-state' : ''} ${className}`}
            {...props}
          />
          {rightIcon && <div className="app-input-right-icon">{rightIcon}</div>}
        </div>

        {error ? (
          <span className="app-input-error-msg">{error}</span>
        ) : (
          helperText && <span className="app-input-helper">{helperText}</span>
        )}
      </div>
    )
  }
)

AppInput.displayName = 'AppInput'
