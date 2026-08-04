'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'

type Tone = 'blue' | 'teal' | 'orange' | 'rose' | 'violet'

interface BarDatum {
  label: string
  value: number
  tone?: Tone
}

interface MeterDatum {
  label: string
  value: number
  tone?: 'blue' | 'teal' | 'orange' | 'rose'
}

const TONE_MAP: Record<string, { grad: string; glow: string; pillBg: string; pillColor: string }> = {
  blue:   { grad: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)', glow: 'rgba(37, 99, 235, 0.35)', pillBg: '#eff6ff', pillColor: '#1d4ed8' },
  teal:   { grad: 'linear-gradient(180deg, #2dd4bf 0%, #0d9488 100%)', glow: 'rgba(13, 148, 136, 0.35)', pillBg: '#f0fdf4', pillColor: '#0f766e' },
  violet: { grad: 'linear-gradient(180deg, #c084fc 0%, #9333ea 100%)', glow: 'rgba(147, 51, 234, 0.35)', pillBg: '#f5f3ff', pillColor: '#6b21a8' },
  orange: { grad: 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)', glow: 'rgba(234, 88, 12, 0.35)',  pillBg: '#fff7ed', pillColor: '#c2410c' },
  rose:   { grad: 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)', glow: 'rgba(225, 29, 72, 0.35)',  pillBg: '#fff1f2', pillColor: '#be123c' },
}

export function MiniBarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="mini-bar-chart-wrap">
      {data.map((item) => {
        const heightPct = Math.max((item.value / max) * 100, item.value > 0 ? 12 : 6)
        const style = TONE_MAP[item.tone ?? 'blue'] ?? TONE_MAP.blue

        return (
          <div key={item.label} className="mini-bar-column">
            {/* Numeric badge value */}
            <div
              className="mini-bar-badge"
              style={{
                color: item.value > 0 ? style.pillColor : '#64748b',
                backgroundColor: item.value > 0 ? style.pillBg : '#f1f5f9',
                boxShadow: item.value > 0 ? `0 2px 6px ${style.glow}` : 'none',
              }}
            >
              {item.value.toLocaleString('en-IN')}
            </div>

            {/* Track & Bar Container */}
            <div className="mini-bar-track-box">
              <div
                className="mini-bar-fill"
                style={{
                  height: `${heightPct}%`,
                  background: style.grad,
                  boxShadow: item.value > 0 ? `0 4px 14px ${style.glow}` : 'none',
                }}
              />
            </div>

            {/* Label below */}
            <div className="mini-bar-column-label">{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export function DonutMeter({
  value,
  label,
  tone = 'teal',
}: {
  value: number
  label: string
  tone?: 'blue' | 'teal' | 'orange' | 'rose'
}) {
  const normalized = Math.max(0, Math.min(value, 100))
  const radius = 52
  const strokeWidth = 11
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalized / 100) * circumference

  const colors = tone === 'teal'
    ? { start: '#2dd4bf', end: '#0d9488', bg: '#ccfbf1', text: '#0f766e' }
    : tone === 'orange'
    ? { start: '#fb923c', end: '#ea580c', bg: '#ffedd5', text: '#c2410c' }
    : tone === 'rose'
    ? { start: '#fb7185', end: '#e11d48', bg: '#ffe4e6', text: '#be123c' }
    : { start: '#60a5fa', end: '#2563eb', bg: '#dbeafe', text: '#1d4ed8' }

  return (
    <div className="donut-meter-container">
      <div className="donut-meter-svg-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140" className="donut-meter-svg">
          <defs>
            <linearGradient id={`donut-grad-${tone}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
          {/* Background Track Circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={`url(#donut-grad-${tone})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
            className="donut-meter-circle-progress"
          />
        </svg>

        {/* Center Readout */}
        <div className="donut-meter-center-readout">
          <div className="donut-meter-percent">{normalized}%</div>
          <div className="donut-meter-sublabel" style={{ color: colors.text }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

const METER_TONES: Record<string, { grad: string; glow: string; pillBg: string; pillColor: string }> = {
  orange: { grad: 'linear-gradient(90deg, #fb923c 0%, #ea580c 100%)', glow: 'rgba(234, 88, 12, 0.25)', pillBg: '#fff7ed', pillColor: '#c2410c' },
  teal:   { grad: 'linear-gradient(90deg, #2dd4bf 0%, #0d9488 100%)', glow: 'rgba(13, 148, 136, 0.25)', pillBg: '#f0fdf4', pillColor: '#0f766e' },
  blue:   { grad: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)', glow: 'rgba(37, 99, 235, 0.25)', pillBg: '#eff6ff', pillColor: '#1d4ed8' },
  rose:   { grad: 'linear-gradient(90deg, #fb7185 0%, #e11d48 100%)', glow: 'rgba(225, 29, 72, 0.25)', pillBg: '#fff1f2', pillColor: '#be123c' },
}

export function ProgressMeters({ items }: { items: MeterDatum[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="progress-meters-list">
      {items.map((item) => {
        const widthPct = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 4)
        const toneStyle = METER_TONES[item.tone ?? 'blue'] ?? METER_TONES.blue

        return (
          <div key={item.label} className="progress-meter-item">
            <div className="progress-meter-head">
              <span className="progress-meter-label">{item.label}</span>
              <span
                className="progress-meter-badge"
                style={{
                  color: item.value > 0 ? toneStyle.pillColor : '#64748b',
                  backgroundColor: item.value > 0 ? toneStyle.pillBg : '#f1f5f9',
                  boxShadow: item.value > 0 ? `0 2px 6px ${toneStyle.glow}` : 'none',
                }}
              >
                {item.value.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="progress-meter-track">
              <div
                className="progress-meter-fill"
                style={{
                  width: `${widthPct}%`,
                  background: toneStyle.grad,
                  boxShadow: item.value > 0 ? `0 2px 8px ${toneStyle.glow}` : 'none',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SparklineChart({
  data,
  color = '#2563eb',
  height = 45,
  dataKey = 'val',
}: {
  data: { [key: string]: any }[]
  color?: string
  height?: number
  dataKey?: string
}) {
  if (!data || data.length === 0) return null

  const id = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div style={{ width: '100%', height, marginTop: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.2}
            fillOpacity={1}
            fill={`url(#${id})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
