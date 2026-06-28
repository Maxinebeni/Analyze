import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import type { ChatMessage, DataRow } from '../types'
import { getColumnStats } from '../utils/parseFile'

const QUICK_QS = [
  'Summarise this dataset',
  'What trends do you see?',
  'Which items perform best?',
  'Highlight any anomalies',
  'Give me recommendations',
  'Show a chart of the top category',
]

interface Props {
  rows: DataRow[]
  sheetName: string
  messages: ChatMessage[]
  setMessages: (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
}

export default function ChatTab({ rows, sheetName, messages, setMessages }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const stats = getColumnStats(rows)
      const sample = rows.slice(0, 5)
      const contextPayload = {
        sheetName,
        totalRows: stats.totalRows,
        columns: Object.keys(rows[0] ?? {}),
        numericCols: stats.numericCols,
        categoryCols: stats.categoryCols,
        sample,
        question: text.trim(),
        history: messages.slice(-10)
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextPayload)
      })

      let reply: string
      if (res.ok) {
        const data = await res.json()
        reply = data.reply ?? 'No response from server.'
      } else {
        reply = `⚠️ Backend not connected yet. In the full app, this would analyse your **${sheetName}** dataset (${stats.totalRows.toLocaleString()} rows) using Gemini AI and answer: _"${text}"_\n\nConnect the FastAPI backend to enable live AI responses.`
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Backend not connected yet. In the full app, this would analyse your **${sheetName}** dataset (${rows.length.toLocaleString()} rows) using Gemini AI.\n\nConnect the FastAPI backend to enable live AI responses.`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gh-muted text-sm pt-8">
            Ask anything about your data — or use a quick question below.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${ msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gh-surface border border-gh-border2 text-gh-text rounded-br-sm'
                  : 'bg-[#0D2340] border border-[#1A4080] text-gh-text rounded-bl-sm'
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gh-muted mb-1">
                {msg.role === 'user' ? 'You' : 'DataLens AI'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0D2340] border border-[#1A4080] rounded-xl rounded-bl-sm px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gh-muted mb-2">DataLens AI</div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gh-blue rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="px-6 pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gh-muted mb-2">Quick questions</div>
        <div className="grid grid-cols-3 gap-1.5">
          {QUICK_QS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs text-gh-muted border border-gh-border rounded-lg px-3 py-2
                         hover:border-gh-blue hover:text-gh-text transition-colors text-left
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about your data…"
            disabled={loading}
            className="flex-1 bg-gh-surface border border-gh-border2 text-gh-text rounded-lg px-4 py-2.5
                       text-sm placeholder:text-gh-muted focus:outline-none focus:border-gh-blue
                       disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-gh-green2 hover:bg-gh-green text-white rounded-lg px-4 py-2.5
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
