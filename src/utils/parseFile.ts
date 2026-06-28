import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { DataRow, SheetData } from '../types'

export async function parseFile(file: File): Promise<SheetData> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse<DataRow>(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => resolve({ Sheet1: result.data }),
        error: reject
      })
    })
  }

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheets: SheetData = {}
  for (const sheetName of wb.SheetNames) {
    sheets[sheetName] = XLSX.utils.sheet_to_json<DataRow>(wb.Sheets[sheetName], {
      defval: null
    })
  }
  return sheets
}

export function getColumnStats(rows: DataRow[]) {
  if (!rows.length) return { numericCols: [], categoryCols: [], totalRows: 0, nullCount: 0 }

  const cols = Object.keys(rows[0])
  const numericCols: string[] = []
  const categoryCols: string[] = []
  let nullCount = 0

  for (const col of cols) {
    let isNumeric = true
    for (const row of rows) {
      if (row[col] === null || row[col] === undefined || row[col] === '') {
        nullCount++
      } else if (typeof row[col] !== 'number') {
        isNumeric = false
      }
    }
    if (isNumeric) numericCols.push(col)
    else categoryCols.push(col)
  }

  return { numericCols, categoryCols, totalRows: rows.length, nullCount }
}

export function aggregateBy(
  rows: DataRow[],
  xCol: string,
  yCol: string,
  fn: 'sum' | 'mean' | 'count' | 'max' | 'min' = 'sum'
): { x: string | number; y: number }[] {
  const groups: Record<string, number[]> = {}
  for (const row of rows) {
    const key = String(row[xCol] ?? '(empty)')
    const val = Number(row[yCol])
    if (!isNaN(val)) {
      groups[key] = groups[key] ?? []
      groups[key].push(val)
    }
  }
  return Object.entries(groups).map(([x, vals]) => {
    let y: number
    switch (fn) {
      case 'sum':   y = vals.reduce((a, b) => a + b, 0); break
      case 'mean':  y = vals.reduce((a, b) => a + b, 0) / vals.length; break
      case 'count': y = vals.length; break
      case 'max':   y = Math.max(...vals); break
      case 'min':   y = Math.min(...vals); break
    }
    return { x, y }
  })
}
