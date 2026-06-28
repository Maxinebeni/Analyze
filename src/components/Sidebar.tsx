import { useRef } from 'react'
import { BarChart2, Upload, Trash2 } from 'lucide-react'
import { parseFile, getColumnStats } from '../utils/parseFile'
import type { SheetData, DataRow } from '../types'

interface Props {
  sheets: SheetData
  activeSheet: string
  rows: DataRow[]
  onFileLoaded: (data: SheetData) => void
  onSheetChange: (sheet: string) => void
  onClearChat: () => void
  hasData: boolean
}

export default function Sidebar({
  sheets, activeSheet, rows,
  onFileLoaded, onSheetChange, onClearChat, hasData
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const sheetNames = Object.keys(sheets)

  async function handleFile(file: File) {
    try {
      const data = await parseFile(file)
      onFileLoaded(data)
    } catch (e) {
      console.error(e)
    }
  }

  const stats = hasData ? getColumnStats(rows) : null

  return (
    <aside className="w-64 shrink-0 bg-gh-surface border-r border-gh-border flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-gh-border">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-gh-blue" size={22} />
          <span className="font-bold text-gh-text text-lg">DataLens AI</span>
        </div>
        <p className="text-gh-muted text-xs mt-1">Excel & CSV Intelligence</p>
      </div>

      {/* Upload */}
      <div className="p-4">
        <SectionLabel>Upload Your Data</SectionLabel>
        <div
          className="border-2 border-dashed border-gh-border2 rounded-xl p-4 text-center cursor-pointer
                     hover:border-gh-blue transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <Upload size={20} className="mx-auto mb-2 text-gh-muted" />
          <p className="text-gh-muted text-xs">Drop file here or click to browse</p>
          <p className="text-gh-muted text-xs mt-1 opacity-60">CSV, XLSX, XLS, XLSM</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.xlsm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {hasData && (
        <>
          {/* Sheet selector */}
          {sheetNames.length > 1 && (
            <div className="px-4 pb-2">
              <SectionLabel>Sheet</SectionLabel>
              <select
                value={activeSheet}
                onChange={(e) => onSheetChange(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border2 text-gh-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gh-blue"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear chat */}
          <div className="px-4 pb-4">
            <button
              onClick={onClearChat}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gh-muted
                         hover:text-gh-text border border-gh-border rounded-lg transition-colors hover:border-gh-border2"
            >
              <Trash2 size={14} />
              Clear chat
            </button>
          </div>

          {/* Stats */}
          <div className="px-4">
            <SectionLabel>Dataset Stats</SectionLabel>
            <MetricCard
              label="Rows × Columns"
              value={`${stats!.totalRows.toLocaleString()} × ${Object.keys(rows[0] ?? {}).length}`}
            />
            <MetricCard
              label="Numeric Columns"
              value={String(stats!.numericCols.length)}
            />
            <MetricCard
              label="Missing Values"
              value={stats!.nullCount.toLocaleString()}
              sub={`${((stats!.nullCount / (stats!.totalRows * Object.keys(rows[0] ?? {}).length || 1)) * 100).toFixed(1)}% of cells`}
            />
          </div>
        </>
      )}
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-widest text-gh-blue
                    border-b border-gh-border pb-1 mb-3">
      {children}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gh-bg border border-gh-border rounded-xl p-4 mb-2 hover:border-gh-blue transition-colors">
      <div className="text-xs font-semibold uppercase tracking-widest text-gh-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-gh-text">{value}</div>
      {sub && <div className="text-xs text-gh-muted mt-0.5">{sub}</div>}
    </div>
  )
}
