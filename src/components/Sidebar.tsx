import { useRef } from 'react'
import { Upload, Trash2 } from 'lucide-react'
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

function AmbiTechLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Green A */}
      <polygon points="50,8 82,78 67,78 50,42 33,78 18,78" fill="#5DB840"/>
      <rect x="33" y="60" width="34" height="9" fill="#5DB840"/>
      {/* Top arc */}
      <path d="M28,38 Q22,10 50,5 Q78,0 80,28" stroke="#0D1F45" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* Bottom arc */}
      <path d="M18,72 Q12,95 50,98 Q88,101 88,72" stroke="#0D1F45" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* Middle arc */}
      <path d="M15,52 Q30,30 55,42" stroke="#0D1F45" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Nodes */}
      <circle cx="50" cy="5" r="5" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="80" cy="28" r="4.5" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="50" cy="52" r="6" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="18" cy="72" r="4" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="88" cy="76" r="3.5" fill="#0D1F45"/>
    </svg>
  )
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
    <aside className="w-64 shrink-0 bg-ambi-surface border-r border-ambi-border flex flex-col overflow-y-auto shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-ambi-border bg-ambi-navy">
        <div className="flex items-center gap-3">
          <AmbiTechLogo />
          <div>
            <span className="font-bold text-white text-base leading-tight block">AMBI-TECH</span>
            <p className="text-green-300 text-xs mt-0.5">Data Intelligence</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="p-4">
        <SectionLabel>Upload Your Data</SectionLabel>
        <div
          className="border-2 border-dashed border-ambi-border2 rounded-xl p-4 text-center cursor-pointer
                     hover:border-ambi-green transition-colors bg-ambi-bg"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <Upload size={20} className="mx-auto mb-2 text-ambi-muted" />
          <p className="text-ambi-muted text-xs">Drop file here or click to browse</p>
          <p className="text-ambi-muted text-xs mt-1 opacity-60">CSV, XLSX, XLS, XLSM</p>
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
                className="w-full bg-ambi-bg border border-ambi-border2 text-ambi-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-ambi-green"
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
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ambi-muted
                         hover:text-ambi-text border border-ambi-border rounded-lg transition-colors hover:border-ambi-border2"
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
    <div className="text-xs font-semibold uppercase tracking-widest text-ambi-green
                    border-b border-ambi-border pb-1 mb-3">
      {children}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-ambi-bg border border-ambi-border rounded-xl p-4 mb-2 hover:border-ambi-green transition-colors">
      <div className="text-xs font-semibold uppercase tracking-widest text-ambi-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-ambi-text">{value}</div>
      {sub && <div className="text-xs text-ambi-muted mt-0.5">{sub}</div>}
    </div>
  )
}
