import * as XLSX from 'xlsx'

export interface ExcelSheet {
  name: string
  headers: string[]
  rows: (string | number | null)[][]
}

// Download a multi-sheet .xlsx file in the browser
export function downloadExcel(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new()

  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows])

    // Bold + background for header row
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
      if (cell) {
        cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'EFF6FF' } } }
      }
    }

    // Auto column widths
    ws['!cols'] = sheet.headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map(r => String(r[i] ?? '').length)
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
  }

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}
