import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getColumnStats, aggregateBy } from '../utils/parseFile'
import type { DataRow } from '../types'

const BLUE = '#388BFD'
const GREEN = '#3FB950'
const PINK = '#DB61A2'
const PIE_COLORS = ['#388BFD', '#3FB950', '#DB61A2', '#F0883E', '#A5D6FF', '#56D364', '#FF7EE2', '#FFA657']

const tooltipStyle = {
  backgroundColor: '#161B22',
  border: '1px solid #30363D',
  borderRadius: 8,
  color: '#E6EDF3',
  fontSize: 12,
}

interface Props {
  rows: DataRow[]
  sheetName: string
}

export default function ExploreTab({ rows }: Props) {
  const stats = useMemo(() => getColumnStats(rows), [rows])
  const cols = rows.length ? Object.keys(rows[0]) : []

  const [customX, setCustomX] = useState(cols[0] ?? '')
  const [customY, setCustomY] = useState(stats.numericCols[0] ?? cols[0] ?? '')
  const [customType, setCustomType] = useState<'bar' | 'line' | 'scatter' | 'pie'>('bar')
  const [customAgg, setCustomAgg] = useState<'sum' | 'mean' | 'count' | 'max' | 'min'>('sum')
  const [showCustom, setShowCustom] = useState(false)

  const autoCharts = useMemo(() => buildAutoCharts(rows, stats), [rows, stats])

  const customData = useMemo(() => {
    if (!showCustom || !customX || !customY) return []
    return aggregateBy(rows, customX, customY, customAgg)
      .sort((a, b) => (b.y as number) - (a.y as number))
      .slice(0, 15)
  }, [rows, customX, customY, customAgg, showCustom])

  return (
    <div className="p-6 space-y-8">
      {stats.numericCols.length > 0 && (
        <section>
          <SectionLabel>Overview</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.numericCols.slice(0, 4).map((col) => {
              const vals = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v))
              const sum = vals.reduce((a, b) => a + b, 0)
              const avg = sum / (vals.length || 1)
              const max = Math.max(...vals)
              return (
                <div key={col} className="bg-gh-surface border border-gh-border rounded-xl p-4 hover:border-gh-blue transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-widest text-gh-muted mb-1">{col}</div>
                  <div className="text-2xl font-bold text-gh-text">{sum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="text-xs text-gh-muted mt-0.5">
                    avg {avg.toLocaleString(undefined, { maximumFractionDigits: 1 })} | max {max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {autoCharts.length > 0 && (
        <section>
          <SectionLabel>Auto Charts</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {autoCharts.map((chart, i) => (
              <ChartCard key={i} title={chart.title}>
                {chart.element}
              </ChartCard>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionLabel>Custom Chart</SectionLabel>
        <div className="bg-gh-surface border border-gh-border rounded-xl p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <SelectField label="Type" value={customType} onChange={(v) => setCustomType(v as typeof customType)}>
              {(['bar', 'line', 'scatter', 'pie'] as const).map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </SelectField>
            <SelectField label="X / Category" value={customX} onChange={setCustomX}>
              {cols.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <SelectField label="Y / Value" value={customY} onChange={setCustomY}>
              {(stats.numericCols.length ? stats.numericCols : cols).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectField>
            <SelectField label="Aggregation" value={customAgg} onChange={(v) => setCustomAgg(v as typeof customAgg)}>
              {(['sum', 'mean', 'count', 'max', 'min'] as const).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </SelectField>
          </div>
          <button
            onClick={() => setShowCustom(true)}
            className="bg-gh-green2 hover:bg-gh-green text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Generate Chart
          </button>

          {showCustom && customData.length > 0 && (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                {customType === 'pie' ? (
                  <PieChart>
                    <Pie data={customData} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={100} label>
                      {customData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                ) : customType === 'line' ? (
                  <LineChart data={customData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="x" tick={{ fill: '#7D8590', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#7D8590', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="y" stroke={BLUE} strokeWidth={2} dot={false} />
                  </LineChart>
                ) : customType === 'scatter' ? (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="x" tick={{ fill: '#7D8590', fontSize: 11 }} />
                    <YAxis dataKey="y" tick={{ fill: '#7D8590', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Scatter data={customData} fill={PINK} opacity={0.7} />
                  </ScatterChart>
                ) : (
                  <BarChart data={customData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="x" tick={{ fill: '#7D8590', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#7D8590', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="y" fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function buildAutoCharts(rows: DataRow[], stats: ReturnType<typeof getColumnStats>) {
  const charts: { title: string; element: JSX.Element }[] = []
  const { numericCols, categoryCols } = stats
  if (!rows.length) return charts

  const tooltip = { contentStyle: tooltipStyle }

  if (categoryCols.length && numericCols.length) {
    const xCol = categoryCols[0]
    const yCol = numericCols[0]
    const data = aggregateBy(rows, xCol, yCol, 'sum')
      .sort((a, b) => (b.y as number) - (a.y as number)).slice(0, 12)
    charts.push({
      title: `Top ${xCol} by ${yCol}`,
      element: (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
            <XAxis dataKey="x" tick={{ fill: '#7D8590', fontSize: 10 }} />
            <YAxis tick={{ fill: '#7D8590', fontSize: 10 }} />
            <Tooltip {...tooltip} />
            <Bar dataKey="y" fill={BLUE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    })
  }

  if (numericCols.length) {
    const col = numericCols[0]
    const vals = rows.map((r) => ({ x: Number(r[col]) })).filter((v) => !isNaN(v.x))
    const min = Math.min(...vals.map((v) => v.x))
    const max = Math.max(...vals.map((v) => v.x))
    const bins = 20
    const buckets: { range: string; count: number }[] = Array.from({ length: bins }, (_, i) => ({
      range: `${(min + (i * (max - min)) / bins).toFixed(0)}`,
      count: 0
    }))
    vals.forEach(({ x }) => {
      const idx = Math.min(Math.floor(((x - min) / (max - min || 1)) * bins), bins - 1)
      buckets[idx].count++
    })
    charts.push({
      title: `Distribution of ${col}`,
      element: (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
            <XAxis dataKey="range" tick={{ fill: '#7D8590', fontSize: 10 }} />
            <YAxis tick={{ fill: '#7D8590', fontSize: 10 }} />
            <Tooltip {...tooltip} />
            <Bar dataKey="count" fill={GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    })
  }

  if (numericCols.length >= 2) {
    const xC = numericCols[0], yC = numericCols[1]
    const data = rows.slice(0, 500).map((r) => ({ x: Number(r[xC]), y: Number(r[yC]) })).filter((d) => !isNaN(d.x) && !isNaN(d.y))
    charts.push({
      title: `${xC} vs ${yC}`,
      element: (
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
            <XAxis dataKey="x" name={xC} tick={{ fill: '#7D8590', fontSize: 10 }} />
            <YAxis dataKey="y" name={yC} tick={{ fill: '#7D8590', fontSize: 10 }} />
            <Tooltip {...tooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill={PINK} opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    })
  }

  if (categoryCols.length && numericCols.length) {
    const xCol = categoryCols[0]
    const yCol = numericCols[0]
    const data = aggregateBy(rows, xCol, yCol, 'sum')
      .sort((a, b) => (b.y as number) - (a.y as number)).slice(0, 8)
    charts.push({
      title: `${yCol} share by ${xCol}`,
      element: (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={80}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#7D8590' }} />
          </PieChart>
        </ResponsiveContainer>
      )
    })
  }

  return charts
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gh-surface border border-gh-border rounded-xl p-4">
      <div className="text-sm font-medium text-gh-text mb-3">{title}</div>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-widest text-gh-blue border-b border-gh-border pb-1 mb-4">
      {children}
    </div>
  )
}

function SelectField({
  label, value, onChange, children
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs text-gh-muted block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gh-bg border border-gh-border2 text-gh-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gh-blue"
      >
        {children}
      </select>
    </div>
  )
}
