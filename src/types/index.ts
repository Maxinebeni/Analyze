export interface DataRow {
  [key: string]: string | number | null
}

export interface SheetData {
  [sheetName: string]: DataRow[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  chartDirective?: ChartDirective
}

export interface ChartDirective {
  type: 'bar' | 'line' | 'scatter' | 'histogram' | 'pie'
  xCol: string
  yCol: string
  title: string
}

export type TabId = 'chat' | 'explore' | 'data'
