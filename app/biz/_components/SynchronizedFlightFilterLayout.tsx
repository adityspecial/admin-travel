'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plane,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  ShieldCheck,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  ChevronRight,
  Sparkles,
  Calendar,
  X,
  Luggage,
  Coffee,
  Info,
  ChevronDown,
  ArrowRight,
  DollarSign,
  Search,
} from 'lucide-react'
import './SynchronizedFlightFilterLayout.css'

/* ── Types & Interfaces ── */
export interface FlightItem {
  id: string
  airline: string
  airlineLogo: string
  flightNumber: string
  aircraft: string
  origin: string
  originCity: string
  destination: string
  destinationCity: string
  departureTime: string // HH:MM
  arrivalTime: string   // HH:MM
  durationMinutes: number
  stops: number
  price: number
  originalPrice: number
  corporateSavings: number
  cabin: 'Economy' | 'Premium Economy' | 'Business' | 'First Class'
  refundable: boolean
  policyStatus: 'in_policy' | 'requires_approval' | 'out_of_policy'
  policyReason?: string
  freeBaggage: string
  freeMeal: boolean
  wifiAvailable: boolean
  usbPower: boolean
  availableSeats: number
}

interface FilterState {
  searchQuery: string
  airlines: string[]
  stops: string // 'all' | '0' | '1' | '2+'
  maxPrice: number
  departureTimes: string[] // 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night'
  cabins: string[]
  refundableOnly: boolean
  policyStatus: string // 'all' | 'in_policy' | 'requires_approval' | 'out_of_policy'
  freeMealOnly: boolean
}

/* Mock Corporate Flight Search Dataset */
const MOCK_FLIGHTS: FlightItem[] = [
  {
    id: 'FL-101',
    airline: 'Air India',
    airlineLogo: '🇮🇳',
    flightNumber: 'AI-504',
    aircraft: 'Airbus A320neo',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '06:00',
    arrivalTime: '08:15',
    durationMinutes: 135,
    stops: 0,
    price: 4850,
    originalPrice: 5600,
    corporateSavings: 750,
    cabin: 'Economy',
    refundable: true,
    policyStatus: 'in_policy',
    freeBaggage: '25 kg + 7 kg',
    freeMeal: true,
    wifiAvailable: true,
    usbPower: true,
    availableSeats: 9,
  },
  {
    id: 'FL-102',
    airline: 'IndiGo',
    airlineLogo: '🟦',
    flightNumber: '6E-2134',
    aircraft: 'Airbus A321neo',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '07:15',
    arrivalTime: '09:25',
    durationMinutes: 130,
    stops: 0,
    price: 4200,
    originalPrice: 4900,
    corporateSavings: 700,
    cabin: 'Economy',
    refundable: false,
    policyStatus: 'in_policy',
    freeBaggage: '15 kg + 7 kg',
    freeMeal: false,
    wifiAvailable: false,
    usbPower: true,
    availableSeats: 14,
  },
  {
    id: 'FL-103',
    airline: 'Vistara',
    airlineLogo: '🟣',
    flightNumber: 'UK-995',
    aircraft: 'Boeing 787-9',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '10:20',
    arrivalTime: '12:35',
    durationMinutes: 135,
    stops: 0,
    price: 6400,
    originalPrice: 7200,
    corporateSavings: 800,
    cabin: 'Premium Economy',
    refundable: true,
    policyStatus: 'requires_approval',
    policyReason: 'Premium economy fare exceeds standard cap by ₹900',
    freeBaggage: '25 kg + 10 kg',
    freeMeal: true,
    wifiAvailable: true,
    usbPower: true,
    availableSeats: 5,
  },
  {
    id: 'FL-104',
    airline: 'Akasa Air',
    airlineLogo: '🧡',
    flightNumber: 'QP-1102',
    aircraft: 'Boeing 737 MAX',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '11:45',
    arrivalTime: '14:00',
    durationMinutes: 135,
    stops: 0,
    price: 3950,
    originalPrice: 4400,
    corporateSavings: 450,
    cabin: 'Economy',
    refundable: false,
    policyStatus: 'in_policy',
    freeBaggage: '15 kg + 7 kg',
    freeMeal: false,
    wifiAvailable: false,
    usbPower: true,
    availableSeats: 18,
  },
  {
    id: 'FL-105',
    airline: 'SpiceJet',
    airlineLogo: '🔴',
    flightNumber: 'SG-8161',
    aircraft: 'Boeing 737-800',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '14:10',
    arrivalTime: '17:25',
    durationMinutes: 195,
    stops: 1,
    price: 3600,
    originalPrice: 4100,
    corporateSavings: 500,
    cabin: 'Economy',
    refundable: false,
    policyStatus: 'in_policy',
    freeBaggage: '15 kg + 7 kg',
    freeMeal: false,
    wifiAvailable: false,
    usbPower: false,
    availableSeats: 6,
  },
  {
    id: 'FL-106',
    airline: 'Air India',
    airlineLogo: '🇮🇳',
    flightNumber: 'AI-805',
    aircraft: 'Boeing 777-300ER',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '17:30',
    arrivalTime: '19:45',
    durationMinutes: 135,
    stops: 0,
    price: 12500,
    originalPrice: 14500,
    corporateSavings: 2000,
    cabin: 'Business',
    refundable: true,
    policyStatus: 'out_of_policy',
    policyReason: 'Business Class requires VP level authorization',
    freeBaggage: '35 kg + 12 kg',
    freeMeal: true,
    wifiAvailable: true,
    usbPower: true,
    availableSeats: 4,
  },
  {
    id: 'FL-107',
    airline: 'IndiGo',
    airlineLogo: '🟦',
    flightNumber: '6E-5312',
    aircraft: 'Airbus A320neo',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '19:00',
    arrivalTime: '21:10',
    durationMinutes: 130,
    stops: 0,
    price: 4900,
    originalPrice: 5500,
    corporateSavings: 600,
    cabin: 'Economy',
    refundable: true,
    policyStatus: 'in_policy',
    freeBaggage: '15 kg + 7 kg',
    freeMeal: false,
    wifiAvailable: false,
    usbPower: true,
    availableSeats: 11,
  },
  {
    id: 'FL-108',
    airline: 'Vistara',
    airlineLogo: '🟣',
    flightNumber: 'UK-944',
    aircraft: 'Airbus A320neo',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    departureTime: '20:45',
    arrivalTime: '23:00',
    durationMinutes: 135,
    stops: 0,
    price: 5200,
    originalPrice: 5900,
    corporateSavings: 700,
    cabin: 'Economy',
    refundable: true,
    policyStatus: 'in_policy',
    freeBaggage: '15 kg + 7 kg',
    freeMeal: true,
    wifiAvailable: true,
    usbPower: true,
    availableSeats: 7,
  },
]

export default function SynchronizedFlightFilterLayout() {
  /* ── State ── */
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    airlines: [],
    stops: 'all',
    maxPrice: 15000,
    departureTimes: [],
    cabins: [],
    refundableOnly: false,
    policyStatus: 'all',
    freeMealOnly: false,
  })

  const [sortBy, setSortBy] = useState<'cheapest' | 'fastest' | 'earliest' | 'policy'>('cheapest')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [selectedFlightModal, setSelectedFlightModal] = useState<FlightItem | null>(null)

  /* ── Refs for Synchronized Scroll ── */
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const resultsScrollRef = useRef<HTMLDivElement>(null)

  /* ── Rule 1 to Rule 7: Synchronized Scroll Controller ── */
  useEffect(() => {
    const filterEl = filterScrollRef.current
    const resultsEl = resultsScrollRef.current

    if (!filterEl || !resultsEl) return

    const isMobile = () => window.innerWidth < 768

    /* Filter Panel Wheel Event Listener */
    const handleFilterWheel = (e: WheelEvent) => {
      if (isMobile()) return

      const delta = e.deltaY
      const { scrollTop, scrollHeight, clientHeight } = filterEl
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 3
      const isAtTop = scrollTop <= 0

      if (delta > 0) {
        // Scrolling Down over Filter Panel
        if (!isAtBottom) {
          filterEl.scrollTop += delta
          e.preventDefault()
        } else {
          // Reached Filter Bottom -> Transfer scroll to Results Panel!
          const resultsMax = resultsEl.scrollHeight - resultsEl.clientHeight
          if (resultsEl.scrollTop < resultsMax - 3) {
            resultsEl.scrollTop += delta
            e.preventDefault()
          }
          // If Results is ALSO at bottom, default page scroll takes over to show footer naturally!
        }
      } else if (delta < 0) {
        // Scrolling Up over Filter Panel
        if (!isAtTop) {
          filterEl.scrollTop += delta
          e.preventDefault()
        } else {
          // Reached Filter Top
          if (window.scrollY > 0) {
            // Page window scrolls up first (Top Synchronization)
          } else if (resultsEl.scrollTop > 0) {
            // Transfer scroll up to Results panel if results has scroll space
            resultsEl.scrollTop += delta
            e.preventDefault()
          }
        }
      }
    }

    /* Results Panel Wheel Event Listener */
    const handleResultsWheel = (e: WheelEvent) => {
      if (isMobile()) return

      const delta = e.deltaY
      const { scrollTop, scrollHeight, clientHeight } = resultsEl
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 3
      const isAtTop = scrollTop <= 0

      if (delta > 0) {
        // Scrolling Down over Results Panel
        if (!isAtBottom) {
          resultsEl.scrollTop += delta
          e.preventDefault()
        } else {
          // Reached Bottom of Results -> Allow page scroll down naturally to reveal footer!
        }
      } else if (delta < 0) {
        // Scrolling Up over Results Panel
        if (!isAtTop) {
          resultsEl.scrollTop += delta
          e.preventDefault()
        } else {
          // Reached Top of Results -> Transfer scroll up to Filter Panel!
          if (filterEl.scrollTop > 0) {
            filterEl.scrollTop += delta
            e.preventDefault()
          } else if (window.scrollY > 0) {
            // Page window scrolls up naturally
          }
        }
      }
    }

    filterEl.addEventListener('wheel', handleFilterWheel, { passive: false })
    resultsEl.addEventListener('wheel', handleResultsWheel, { passive: false })

    return () => {
      filterEl.removeEventListener('wheel', handleFilterWheel)
      resultsEl.removeEventListener('wheel', handleResultsWheel)
    }
  }, [])

  /* Reset All Filters */
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      airlines: [],
      stops: 'all',
      maxPrice: 15000,
      departureTimes: [],
      cabins: [],
      refundableOnly: false,
      policyStatus: 'all',
      freeMealOnly: false,
    })
  }

  /* Active Count Calculation */
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.airlines.length > 0) count += filters.airlines.length
    if (filters.stops !== 'all') count++
    if (filters.maxPrice < 15000) count++
    if (filters.departureTimes.length > 0) count += filters.departureTimes.length
    if (filters.cabins.length > 0) count += filters.cabins.length
    if (filters.refundableOnly) count++
    if (filters.policyStatus !== 'all') count++
    if (filters.freeMealOnly) count++
    return count
  }, [filters])

  /* Filter & Sort Processing */
  const filteredFlights = useMemo(() => {
    return MOCK_FLIGHTS.filter((flight) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        const match =
          flight.airline.toLowerCase().includes(q) ||
          flight.flightNumber.toLowerCase().includes(q) ||
          flight.cabin.toLowerCase().includes(q)
        if (!match) return false
      }

      if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) {
        return false
      }

      if (filters.stops !== 'all') {
        if (filters.stops === '0' && flight.stops !== 0) return false
        if (filters.stops === '1' && flight.stops !== 1) return false
        if (filters.stops === '2+' && flight.stops < 2) return false
      }

      if (flight.price > filters.maxPrice) return false

      if (filters.refundableOnly && !flight.refundable) return false

      if (filters.policyStatus !== 'all' && flight.policyStatus !== filters.policyStatus) {
        return false
      }

      if (filters.freeMealOnly && !flight.freeMeal) return false

      if (filters.cabins.length > 0 && !filters.cabins.includes(flight.cabin)) {
        return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'cheapest') return a.price - b.price
      if (sortBy === 'fastest') return a.durationMinutes - b.durationMinutes
      if (sortBy === 'earliest') return a.departureTime.localeCompare(b.departureTime)
      if (sortBy === 'policy') {
        const score = { in_policy: 1, requires_approval: 2, out_of_policy: 3 }
        return score[a.policyStatus] - score[b.policyStatus]
      }
      return 0
    })
  }, [filters, sortBy])

  return (
    <div className="sync-layout-root">
      <div className="sync-page-container">
        {/* Top Route Banner */}
        <div className="sync-route-banner">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Corporate Flight Search & Policy Gate
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              New Delhi (DEL) <Plane size={20} color="#60A5FA" /> Mumbai (BOM)
            </h1>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} /> 28 Oct 2026</span>
              <span>•</span>
              <span>1 Adult (Economy)</span>
              <span>•</span>
              <span style={{ color: '#34D399', fontWeight: 700 }}>AirDunia Biz Rate Applied (-15%)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="filter-chip-btn"
              style={{ background: '#ffffff', color: '#1E1B4B', padding: '10px 16px', borderRadius: 12, fontWeight: 800, display: 'none' }}
              id="mobile-filter-open-btn"
            >
              <Filter size={16} /> Filters ({activeFilterCount})
            </button>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '8px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {filteredFlights.length} Flights Available
            </div>
          </div>
        </div>

        {/* Mobile Backdrop Overlay */}
        <div
          className={`mobile-filter-drawer-backdrop ${mobileDrawerOpen ? 'active' : ''}`}
          onClick={() => setMobileDrawerOpen(false)}
        />

        {/* Two-Column Grid Container */}
        <div className="sync-grid-container">
          {/* ───────────────────────────────────────────────────────────────────────────
             LEFT COLUMN: STICKY & SCROLLABLE FILTER SIDEBAR
             ─────────────────────────────────────────────────────────────────────────── */}
          <aside className={`filter-sidebar-wrapper ${mobileDrawerOpen ? 'mobile-drawer-open' : ''}`}>
            {/* Sticky Header */}
            <div className="filter-sticky-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#2563EB',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: '#111827', margin: 0 }}>Flight Filters</h3>
                  {activeFilterCount > 0 ? (
                    <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700 }}>
                      {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>Synchronized scroll</span>
                  )}
                </div>
              </div>

              {activeFilterCount > 0 ? (
                <button
                  onClick={handleResetFilters}
                  style={{
                    fontSize: 11,
                    color: '#DC2626',
                    fontWeight: 800,
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 8,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              ) : (
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Scrollable Filter Content */}
            <div className="filter-scroll-body" ref={filterScrollRef}>
              {/* Quick Search */}
              <div style={{ marginBottom: 14, position: 'relative' }}>
                <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="text"
                  placeholder="Airline or flight no..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Policy Compliance Status Filter */}
              <div className="filter-section-card">
                <div className="filter-section-title">
                  <span>Travel Policy Status</span>
                  <ShieldCheck size={14} color="#2563EB" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { id: 'all', label: 'All Policy Statuses' },
                    { id: 'in_policy', label: 'In Policy Only (Auto Approve)' },
                    { id: 'requires_approval', label: 'Requires Approval' },
                    { id: 'out_of_policy', label: 'Out of Policy' },
                  ].map((item) => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="policyStatus"
                        checked={filters.policyStatus === item.id}
                        onChange={() => setFilters((p) => ({ ...p, policyStatus: item.id }))}
                        style={{ accentColor: '#2563EB' }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stops Filter */}
              <div className="filter-section-card">
                <div className="filter-section-title">
                  <span>Flight Stops</span>
                  <Clock size={14} color="#6B7280" />
                </div>
                <div className="filter-chip-grid">
                  {[
                    { id: 'all', label: 'Any Stops', price: '₹3,600' },
                    { id: '0', label: 'Non-stop', price: '₹3,950' },
                    { id: '1', label: '1 Stop', price: '₹3,600' },
                    { id: '2+', label: '2+ Stops', price: '-' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      className={`filter-chip-btn ${filters.stops === chip.id ? 'active' : ''}`}
                      onClick={() => setFilters((p) => ({ ...p, stops: chip.id }))}
                    >
                      <span>{chip.label}</span>
                      <span className="filter-chip-sub">{chip.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Airlines Checklist */}
              <div className="filter-section-card">
                <div className="filter-section-title">
                  <span>Airlines</span>
                  <Plane size={14} color="#6B7280" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Air India', logo: '🇮🇳', price: '₹4,850' },
                    { name: 'IndiGo', logo: '🟦', price: '₹4,200' },
                    { name: 'Vistara', logo: '🟣', price: '₹5,200' },
                    { name: 'Akasa Air', logo: '🧡', price: '₹3,950' },
                    { name: 'SpiceJet', logo: '🔴', price: '₹3,600' },
                  ].map((airline) => {
                    const isChecked = filters.airlines.includes(airline.name)
                    return (
                      <label
                        key={airline.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12.5,
                          color: '#111827',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                airlines: e.target.checked
                                  ? [...p.airlines, airline.name]
                                  : p.airlines.filter((x) => x !== airline.name),
                              }))
                            }
                            style={{ accentColor: '#2563EB' }}
                          />
                          <span>{airline.logo} {airline.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{airline.price}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="filter-section-card">
                <div className="filter-section-title">
                  <span>Max Budget / Person</span>
                  <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 800 }}>₹{filters.maxPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="15000"
                  step="500"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  <span>Min: ₹3,000</span>
                  <span>Max: ₹15,000</span>
                </div>
              </div>

              {/* Cabin Class */}
              <div className="filter-section-card">
                <div className="filter-section-title">
                  <span>Cabin Class</span>
                  <Briefcase size={14} color="#6B7280" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['Economy', 'Premium Economy', 'Business'].map((cab) => (
                    <label key={cab} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={filters.cabins.includes(cab)}
                        onChange={(e) =>
                          setFilters((p) => ({
                            ...p,
                            cabins: e.target.checked ? [...p.cabins, cab] : p.cabins.filter((x) => x !== cab),
                          }))
                        }
                        style={{ accentColor: '#2563EB' }}
                      />
                      <span>{cab}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Extra Corporate Options */}
              <div className="filter-section-card">
                <div className="filter-section-title">
                  <span>Inclusions & Rules</span>
                  <Sparkles size={14} color="#F59E0B" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filters.refundableOnly}
                      onChange={(e) => setFilters((p) => ({ ...p, refundableOnly: e.target.checked }))}
                      style={{ accentColor: '#2563EB' }}
                    />
                    <span>Refundable Tickets Only</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filters.freeMealOnly}
                      onChange={(e) => setFilters((p) => ({ ...p, freeMealOnly: e.target.checked }))}
                      style={{ accentColor: '#2563EB' }}
                    />
                    <span>Complimentary Meal Included</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="filter-sticky-footer">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  flex: 1,
                  background: '#2563EB',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                Apply Filters ({filteredFlights.length})
              </button>
            </div>
          </aside>

          {/* ───────────────────────────────────────────────────────────────────────────
             RIGHT COLUMN: STICKY & SCROLLABLE SEARCH RESULTS PANEL
             ─────────────────────────────────────────────────────────────────────────── */}
          <main className="results-panel-wrapper">
            {/* Sticky Header inside Results */}
            <div className="results-sticky-header">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111827', margin: 0 }}>
                  Flight Results ({filteredFlights.length})
                </h2>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Prices include corporate discounts & GST tax invoices
                </div>
              </div>

              {/* Sort Tabs Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowUpDown size={13} /> Sort By:
                </span>
                <div className="sort-tab-group">
                  {[
                    { id: 'cheapest', label: 'Cheapest' },
                    { id: 'fastest', label: 'Fastest' },
                    { id: 'earliest', label: 'Earliest' },
                    { id: 'policy', label: 'Policy Fit' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`sort-tab-btn ${sortBy === tab.id ? 'active' : ''}`}
                      onClick={() => setSortBy(tab.id as any)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable Results Area */}
            <div className="results-scroll-body" ref={resultsScrollRef}>
              {/* AirDunia Corporate Guarantee Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  border: '1px solid #A7F3D0',
                  borderRadius: 14,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#10B981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#065F46' }}>
                    AirDunia Corporate Policy Engine Active
                  </div>
                  <div style={{ fontSize: 11.5, color: '#047857', marginTop: 2 }}>
                    Green badges indicate auto-approved flights under your department budget.
                  </div>
                </div>
              </div>

              {/* No Flights Found */}
              {filteredFlights.length === 0 ? (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px border-dashed #D1D5DB',
                  }}
                >
                  <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>No flights match your filters</h3>
                  <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Try clearing some filter options or increasing the maximum price cap.</p>
                  <button
                    onClick={handleResetFilters}
                    style={{
                      marginTop: 14,
                      background: '#2563EB',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                /* Flight Result Cards List */
                filteredFlights.map((flight) => (
                  <div key={flight.id} className="flight-result-card">
                    {/* Card Top Info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{flight.airlineLogo}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                            {flight.airline} <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>({flight.flightNumber})</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{flight.aircraft}</div>
                        </div>
                      </div>

                      {/* Policy Compliance Tag */}
                      <div>
                        {flight.policyStatus === 'in_policy' && (
                          <span className="policy-tag in-policy">
                            <CheckCircle2 size={12} /> IN POLICY
                          </span>
                        )}
                        {flight.policyStatus === 'requires_approval' && (
                          <span className="policy-tag requires-approval">
                            <AlertTriangle size={12} /> APPROVAL REQD
                          </span>
                        )}
                        {flight.policyStatus === 'out_of_policy' && (
                          <span className="policy-tag out-of-policy">
                            <XCircle size={12} /> OUT OF POLICY
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flight Times & Duration Segment */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr auto',
                        alignItems: 'center',
                        gap: 20,
                        background: '#F9FAFB',
                        padding: '14px 18px',
                        borderRadius: 14,
                        border: '1px solid #F3F4F6',
                      }}
                    >
                      {/* Departure */}
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{flight.departureTime}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{flight.origin} ({flight.originCity})</div>
                      </div>

                      {/* Flight Line */}
                      <div style={{ textAlign: 'center', minWidth: 100 }}>
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                          {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m
                        </div>
                        <div
                          style={{
                            height: 2,
                            background: '#D1D5DB',
                            margin: '4px 0',
                            position: 'relative',
                            borderRadius: 99,
                          }}
                        >
                          <Plane
                            size={12}
                            color="#2563EB"
                            style={{
                              position: 'absolute',
                              top: -5,
                              left: '50%',
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: flight.stops === 0 ? '#047857' : '#B45309', fontWeight: 700 }}>
                          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`}
                        </div>
                      </div>

                      {/* Arrival */}
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{flight.arrivalTime}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{flight.destination} ({flight.destinationCity})</div>
                      </div>

                      {/* Pricing & CTA */}
                      <div style={{ textAlign: 'right', borderLeft: '1px solid #E5E7EB', paddingLeft: 20 }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>
                          ₹{flight.originalPrice.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#2563EB' }}>
                          ₹{flight.price.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#047857', fontWeight: 700 }}>
                          Save ₹{flight.corporateSavings} with Biz Wallet
                        </div>
                      </div>
                    </div>

                    {/* Policy Reason warning if any */}
                    {flight.policyReason && (
                      <div style={{ marginTop: 10, fontSize: 11.5, color: '#B45309', background: '#FFFBEB', padding: '6px 12px', borderRadius: 8, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Info size={12} /> {flight.policyReason}
                      </div>
                    )}

                    {/* Bottom Inclusions & Action Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Luggage size={13} color="#4B5563" /> {flight.freeBaggage}
                        </span>
                        {flight.freeMeal && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#047857' }}>
                            <Coffee size={13} /> Free Meal
                          </span>
                        )}
                        <span style={{ color: flight.refundable ? '#047857' : '#6B7280' }}>
                          {flight.refundable ? '• Refundable' : '• Non-refundable'}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedFlightModal(flight)}
                        style={{
                          background: flight.policyStatus === 'out_of_policy' ? '#4B5563' : '#2563EB',
                          color: '#ffffff',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: 10,
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        <span>{flight.policyStatus === 'in_policy' ? 'Book Flight' : 'Request Approval'}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sticky Bottom Actions inside Results */}
            <div className="results-sticky-footer">
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Showing <strong>{filteredFlights.length}</strong> of <strong>{MOCK_FLIGHTS.length}</strong> flights
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Page 1 of 1</span>
                <button
                  disabled
                  style={{
                    background: '#F3F4F6',
                    color: '#9CA3AF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Prev
                </button>
                <button
                  disabled
                  style={{
                    background: '#F3F4F6',
                    color: '#9CA3AF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Page Footer for Bottom Synchronization Verification */}
        <footer className="sync-page-footer">
          <div>
            <div style={{ fontWeight: 800, color: '#111827', fontSize: 14 }}>AirDunia Corporate Travel System</div>
            <div>Synchronized 2-Column Scrolling • Intelligent Mousewheel Transfer Active</div>
          </div>
          <div style={{ fontSize: 12 }}>© 2026 AirDunia Inc. All rights reserved.</div>
        </footer>
      </div>

      {/* Flight Detail / Fare Modal */}
      {selectedFlightModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedFlightModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 28,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>
                Flight Details ({selectedFlightModal.flightNumber})
              </h3>
              <button onClick={() => setSelectedFlightModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                {selectedFlightModal.airline} • {selectedFlightModal.cabin}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {selectedFlightModal.originCity} ({selectedFlightModal.origin}) → {selectedFlightModal.destinationCity} ({selectedFlightModal.destination})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Base Fare:</span>
                <span style={{ fontWeight: 700 }}>₹{(selectedFlightModal.price * 0.85).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Corporate Discount:</span>
                <span style={{ fontWeight: 700, color: '#047857' }}>-₹{selectedFlightModal.corporateSavings}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
                <span style={{ fontWeight: 800 }}>Total Price:</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#2563EB' }}>₹{selectedFlightModal.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Booking initialized for ${selectedFlightModal.flightNumber}`)
                setSelectedFlightModal(null)
              }}
              style={{
                width: '100%',
                background: '#2563EB',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '12px',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Proceed to Booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
