import React from 'react'
import './DataTable.css'

export interface ColumnDef<T> {
  key: string
  header: React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  headerAction?: React.ReactNode
  footer?: React.ReactNode
  keyExtractor?: (item: T, index: number) => string | number
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found.',
  title,
  subtitle,
  headerAction,
  footer,
  keyExtractor,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`data-table-card ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="data-table-card-header">
          <div>
            {title && <h3 className="data-table-title">{title}</h3>}
            {subtitle && <p className="data-table-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align ?? 'left',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="data-table-skeleton-cell" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor ? keyExtractor(item, index) : item.id ?? index
                return (
                  <tr key={key}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align ?? 'left',
                        }}
                      >
                        {col.render ? col.render(item, index) : item[col.key] ?? '--'}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {footer && <div className="data-table-footer">{footer}</div>}
    </div>
  )
}
