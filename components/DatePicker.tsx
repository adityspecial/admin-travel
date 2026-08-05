'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import './DatePicker.css'

export interface DatePickerProps {
  value: string // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void
  placeholder?: string
  minDate?: string // 'YYYY-MM-DD'
  maxDate?: string // 'YYYY-MM-DD'
  required?: boolean
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

function fmtDisplay(val: string) {
  if (!val) return ''
  const [y, m, d] = val.split('-').map(Number)
  if (!y || !m || !d) return val
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  minDate,
  maxDate,
  required,
  disabled = false,
  style,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const parsed = value ? new Date(value) : new Date()
  const [viewYear, setViewYear] = useState(parsed.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed.getMonth())

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Handle outside click to close popover
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 5 + i)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const cellValue = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isDayDisabled = (d: number) => {
    const dateStr = cellValue(d)
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  return (
    <div ref={containerRef} className={`admin-datepicker-wrapper ${className}`} style={style}>
      <div
        className={`admin-datepicker-input ${open ? 'focused' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <CalendarIcon size={16} color="var(--accent, #E31E24)" />
        <span style={{ flex: 1 }}>
          {value ? (
            fmtDisplay(value)
          ) : (
            <span className="admin-datepicker-placeholder">
              {placeholder}
              {required ? ' *' : ''}
            </span>
          )}
        </span>
        {value && !disabled && (
          <X
            size={14}
            color="#9CA3AF"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>

      {open && !disabled && (
        <div className="admin-datepicker-popover">
          {/* Popover Header */}
          <div className="admin-cal-head">
            <button type="button" className="admin-cal-nav-btn" onClick={() => changeMonth(-1)}>
              <ChevronLeft size={14} />
            </button>

            <div className="admin-cal-title-selects">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="admin-cal-select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="admin-cal-select"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="admin-cal-nav-btn" onClick={() => changeMonth(1)}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="admin-cal-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="admin-cal-grid">
            {cells.map((d, i) =>
              d ? (
                <button
                  key={cellValue(d)}
                  type="button"
                  className={`admin-cal-day ${value === cellValue(d) ? 'selected' : ''}`}
                  disabled={isDayDisabled(d)}
                  onClick={() => {
                    onChange(cellValue(d))
                    setOpen(false)
                  }}
                >
                  {d}
                </button>
              ) : (
                <span key={`e-${i}`} className="admin-cal-empty" />
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
