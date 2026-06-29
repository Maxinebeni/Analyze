export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="text-6xl mb-5">📊</div>
      <h1 className="text-4xl font-bold text-gh-text mb-3">DataLens AI</h1>
      <p className="text-gh-muted text-base max-w-md leading-relaxed mb-8">
        Upload a CSV or Excel file and ask questions about your data in plain English.
        Charts and insights generated automatically.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {[
          '📈 Trend Analysis',
          '🏆 Top Performers',
          '🔍 Anomaly Detection',
          '💡 Recommendations',
          '📊 Auto Charts',
          '🗂 Data Preview',
        ].map((tag) => (
          <span
            key={tag}
            className="bg-gh-surface border border-gh-border rounded-full px-4 py-1.5 text-sm text-gh-muted"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-gh-muted text-sm mt-10 opacity-70">
        ← Upload a file in the sidebar to get started
      </p>
    </div>
  )
}
