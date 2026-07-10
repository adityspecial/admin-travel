'use client'

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

function toneClass(tone?: Tone) {
  return tone && tone !== 'blue' ? tone : ''
}

function meterToneClass(tone?: 'blue' | 'teal' | 'orange' | 'rose') {
  return tone && tone !== 'blue' ? tone : ''
}

export function MiniBarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="mini-chart">
      {data.map((item) => {
        const height = Math.max((item.value / max) * 100, item.value > 0 ? 10 : 0)
        return (
          <div className="mini-bar-group" key={item.label}>
            <div className="mini-bar-value">{item.value.toLocaleString('en-IN')}</div>
            <div className="mini-bar-track">
              <div
                className={`mini-bar ${toneClass(item.tone)}`}
                style={{ height: `${height}%` }}
              />
            </div>
            <div className="mini-bar-label">{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export function DonutMeter({
  value,
  label,
  tone = 'blue',
}: {
  value: number
  label: string
  tone?: 'blue' | 'teal' | 'orange'
}) {
  const normalized = Math.max(0, Math.min(value, 100))

  return (
    <div className="donut-wrap">
      <div className="donut-shell">
        <div className={`donut ${meterToneClass(tone)}`} style={{ ['--value' as string]: normalized }} />
        <div className="donut-center">
          <div className="donut-value">{normalized}%</div>
          <div className="donut-label">{label}</div>
        </div>
      </div>
    </div>
  )
}

export function ProgressMeters({ items }: { items: MeterDatum[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="metric-list">
      {items.map((item) => {
        const width = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)
        return (
          <div className="metric-row" key={item.label}>
            <div className="metric-row-head">
              <span>{item.label}</span>
              <span>{item.value.toLocaleString('en-IN')}</span>
            </div>
            <div className="metric-track">
              <div className={`metric-fill ${meterToneClass(item.tone)}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
