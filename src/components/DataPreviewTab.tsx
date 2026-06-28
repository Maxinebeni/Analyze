import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import type { DataRow } from '../types'

interface Props {
  rows: DataRow[]
  sheetName: string
}

export default function DataPreviewTab({ rows, sheetName }: Props) {
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [expandSchema, setExpandSchema] = useState(false)

  const cols = rows.length ? Object.keys(rows[0]) : []

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }, [rows, search])

  const displayed = filtered.slice(0, pageSize)

  function downloadCSV() {
    const header = cols.join(',')
    const body = rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(',')).join('\n')
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sheetName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const schema = useMemo(() => {
    return cols.map((col) => {
      const vals = rows.map((r) => r[col])
      const nonNull = vals.filter((v) => v !== null && v !== undefined && v !== '').length
      const unique = new Set(vals.map(String)).size
      const isNumeric = vals.every((v) => v === null || v === undefined || v === '' || typeof v === 'number')
      return { col, type: isNumeric ? 'number' : 'string', nonNull, nulls: rows.length - nonNull, unique }
    })
  }, [rows, cols])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-gh-blue border-b border-gh-border pb-1">
          {sheetName} — {rows.length.toLocaleString()} rows × {cols.length} columns
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 text-sm text-gh-muted border border-gh-border
                     rounded-lg px-3 py-1.5 hover:text-gh-text hover:border-gh-border2 transition-colors"
        >
          <Download size={13} /> Download CSV
        </button>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search across all columns…"
          className="flex-1 bg-gh-surface border border-gh-border2 text-gh-text rounded-lg
                     px-4 py-2 text-sm placeholder:text-gh-muted focus:outline-none focus:border-gh-blue"
        />
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="bg-gh-surface border border-gh-border2 text-gh-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gh-blue"
        >
          {[20, 50, 100, 500].map((n) => (
            <option key={n} value={n}>Show {n}</option>
          ))}
        </select>
      </div>

      {search && (
        <div className="text-sm text-gh-green font-semibold">
          ✓ {filtered.length.toLocaleString()} rows match
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-gh-border" style={{ maxHeight: 420 }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gh-surface">
            <tr>
              {cols.map((c) => (
                <th key={c} className="text-left px-3 py-2.5 text-gh-muted font-semibold border-b border-gh-border whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr key={i} className="border-b border-gh-border hover:bg-gh-surface transition-colors">
                {cols.map((c) => (
                  <td key={c} className="px-3 py-2 text-gh-text whitespace-nowrap max-w-[200px] truncate">
                    {row[c] === null || row[c] === undefined ? (
                      <span className="text-gh-muted italic">null</span>
                    ) : (
                      String(row[c])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-gh-border rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandSchema((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gh-muted
                     hover:text-gh-text bg-gh-surface transition-colors"
        >
          <span>Column schema</span>
          <span>{expandSchema ? '▲' : '▼'}</span>
        </button>
        {expandSchema && (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gh-surface">
                <tr>
                  {['Column', 'Type', 'Non-null', 'Nulls', 'Unique'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-gh-muted font-semibold border-b border-gh-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schema.map((s) => (
                  <tr key={s.col} className="border-b border-gh-border">
                    <td className="px-3 py-2 text-gh-text font-medium">{s.col}</td>
                    <td className="px-3 py-2 text-gh-muted">{s.type}</td>
                    <td className="px-3 py-2 text-gh-text">{s.nonNull.toLocaleString()}</td>
                    <td className="px-3 py-2 text-gh-text">{s.nulls.toLocaleString()}</td>
                    <td className="px-3 py-2 text-gh-text">{s.unique.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
