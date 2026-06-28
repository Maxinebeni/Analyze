import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Landing from './components/Landing'
import ChatTab from './components/ChatTab'
import ExploreTab from './components/ExploreTab'
import DataPreviewTab from './components/DataPreviewTab'
import type { SheetData, TabId, ChatMessage } from './types'

export default function App() {
  const [sheets, setSheets] = useState<SheetData>({})
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabId>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const hasData = activeSheet && sheets[activeSheet]?.length > 0

  function handleFileLoaded(data: SheetData) {
    setSheets(data)
    setActiveSheet(Object.keys(data)[0])
    setMessages([])
    setActiveTab('chat')
  }

  function handleClearChat() {
    setMessages([])
  }

  const rows = hasData ? sheets[activeSheet] : []

  return (
    <div className="flex h-screen overflow-hidden bg-gh-bg">
      <Sidebar
        sheets={sheets}
        activeSheet={activeSheet}
        rows={rows}
        onFileLoaded={handleFileLoaded}
        onSheetChange={setActiveSheet}
        onClearChat={handleClearChat}
        hasData={!!hasData}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!hasData ? (
          <Landing />
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex border-b border-gh-border bg-gh-bg px-6 pt-4 gap-1">
              {(['chat', 'explore', 'data'] as TabId[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-gh-blue text-gh-text'
                      : 'border-transparent text-gh-muted hover:text-gh-text'
                  }`}
                >
                  {tab === 'chat' && '💬 Chat'}
                  {tab === 'explore' && '📈 Explore'}
                  {tab === 'data' && '🗂 Data Preview'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === 'chat' && (
                <ChatTab
                  rows={rows}
                  sheetName={activeSheet}
                  messages={messages}
                  setMessages={setMessages}
                />
              )}
              {activeTab === 'explore' && (
                <ExploreTab rows={rows} sheetName={activeSheet} />
              )}
              {activeTab === 'data' && (
                <DataPreviewTab rows={rows} sheetName={activeSheet} />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
