'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { SlidersHorizontal, RotateCcw, Tag, X } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   FilterSidebar — Two-layer architecture for aligned bottom edges
   ─────────────────────────────────────────────────────────────────────────────
   Layer 1: .filter-sidebar  (outer column div)
     • flex-shrink: 0, no fixed height
     • Stretches to the FULL height of the flex row  →  background / border
       reach the same bottom as the right content column
     • background, border-right are defined here in the page CSS

   Layer 2: .filter-sidebar__scroll  (inner sticky scroll container)
     • position: sticky  |  top: 54px
     • height: calc(100vh - 54px)   →  viewport-tall scrollable panel
     • overflow-y: auto + overscroll-behavior: contain
     • The wheel handler lives here — transfers scroll to window when it
       reaches its top or bottom

   Net effect: filter column background always goes to the page footer
   (same as the right content), and the sticky scroller within it gives
   independent scroll with seamless transfer.
───────────────────────────────────────────────────────────────────────────── */

export interface FilterBlockProps {
  id?: string
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export interface ActiveTag {
  id: string
  label: string
  onRemove: () => void
}

export interface FilterSidebarProps {
  title?: string
  icon?: React.ReactNode
  activeCount?: number
  onReset?: () => void
  activeTags?: ActiveTag[]
  showMobile?: boolean
  width?: number | string
  /** Navbar / header height so the sticky scroller sits just below it (default 54px) */
  stickyTop?: number
  children: React.ReactNode
}

/* ── Sub-component: individual filter block card ── */
export function FilterSidebarBlock({ title, icon, children }: FilterBlockProps) {
  return (
    <div className="filter-card-block">
      <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        {icon && <div className="filter-icon-badge">{icon}</div>}
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

/* ── Main FilterSidebar ── */
export function FilterSidebar({
  title = 'Directory Filters',
  icon = <SlidersHorizontal size={16} />,
  activeCount = 0,
  onReset,
  activeTags = [],
  showMobile = false,
  width = 270,
  stickyTop = 54,
  children,
}: FilterSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  /* ── Synchronized scroll-transfer wheel handler ── */
  const handleWheel = useCallback((e: WheelEvent) => {
    const el = scrollRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1
    const atTop    = scrollTop <= 0
    const goingDown = e.deltaY > 0

    if (goingDown) {
      if (atBottom) {
        /* Sidebar fully scrolled → pass to window (right content scrolls) */
        e.preventDefault()
        window.scrollBy({ top: e.deltaY, behavior: 'auto' })
      } else {
        /* Sidebar still has content below → consume here */
        e.preventDefault()
        el.scrollTop += e.deltaY
      }
    } else {
      /* Going up */
      if (atTop) {
        /* Sidebar at top → pass to window */
        e.preventDefault()
        window.scrollBy({ top: e.deltaY, behavior: 'auto' })
      } else {
        /* Sidebar still has content above → consume here */
        e.preventDefault()
        el.scrollTop += e.deltaY
      }
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  return (
    /*
      OUTER COLUMN — class="filter-sidebar"
      Stretches to 100% of the flex-row height so the background + border-right
      always reach the same bottom as the right content column.
      The page-level CSS targets this class for width / background / border.
    */
    <aside
      className={`filter-sidebar${showMobile ? ' mobile-visible' : ''}`}
      style={{ width }}
    >
      {/*
        INNER STICKY SCROLL CONTAINER
        Sticks below the navbar and fills the viewport height.
        Scrolls independently; transfers wheel events to the window at boundaries.
      */}
      <div
        ref={scrollRef}
        className="filter-sidebar__scroll"
        style={{
          position: 'sticky',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '24px 20px',
          /* Thin modern scrollbar */
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(209,213,219,0.9) transparent',
        }}
      >
        {/* ── Sticky Header inside scroll area ── */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'linear-gradient(180deg, #ffffff 82%, rgba(255,255,255,0) 100%)',
            paddingBottom: '14px',
            marginBottom: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Icon badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'var(--accent, #E31E24)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--accent, rgba(227, 30, 36, 0.25))',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              {/* Title + active count */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', margin: 0 }}>
                  {title}
                </h3>
                {activeCount > 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--accent, #E31E24)', fontWeight: 700 }}>
                    {activeCount} filter{activeCount > 1 ? 's' : ''} applied
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Filter options</span>
                )}
              </div>
            </div>

            {/* Clear All button */}
            {activeCount > 0 && onReset && (
              <button
                onClick={onReset}
                style={{
                  fontSize: '11px',
                  color: 'var(--accent, #E31E24)',
                  fontWeight: 800,
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={11} /> Clear All
              </button>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, #E5E7EB, transparent)',
              marginTop: '12px',
            }}
          />
        </div>

        {/* ── Filter block content ── */}
        {children}

        {/* ── Active Filter Tags ── */}
        {activeTags.length > 0 && (
          <div
            style={{
              padding: '14px',
              background: '#FEF2F2',
              borderRadius: '12px',
              border: '1px solid #FCA5A5',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#DC2626',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Tag size={12} /> Active Filter Tags:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {activeTags.map((tag) => (
                <span
                  key={tag.id}
                  onClick={tag.onRemove}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: '#ffffff',
                    color: '#111827',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {tag.label} <X size={10} color="#DC2626" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom fade — visual cue that more filters exist below */}
        <div
          aria-hidden="true"
          style={{
            position: 'sticky',
            bottom: 0,
            height: '28px',
            background: 'linear-gradient(0deg, #ffffff 55%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            marginTop: '8px',
          }}
        />
      </div>
    </aside>
  )
}
