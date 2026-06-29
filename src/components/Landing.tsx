function AmbiTechLogoLarge() {
  return (
    <svg width="80" height="80" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,8 82,78 67,78 50,42 33,78 18,78" fill="#5DB840"/>
      <rect x="33" y="60" width="34" height="9" fill="#5DB840"/>
      <path d="M28,38 Q22,10 50,5 Q78,0 80,28" stroke="#0D1F45" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M18,72 Q12,95 50,98 Q88,101 88,72" stroke="#0D1F45" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M15,52 Q30,30 55,42" stroke="#0D1F45" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="50" cy="5" r="5" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="80" cy="28" r="4.5" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="50" cy="52" r="6" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="18" cy="72" r="4" fill="white" stroke="#0D1F45" strokeWidth="3"/>
      <circle cx="88" cy="76" r="3.5" fill="#0D1F45"/>
    </svg>
  )
}

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="mb-5">
        <AmbiTechLogoLarge />
      </div>
      <h1 className="text-4xl font-bold text-ambi-navy mb-1">AMBI-TECH</h1>
      <p className="text-ambi-green font-semibold text-sm mb-3 tracking-wider">Data Intelligence</p>
      <p className="text-ambi-muted text-base max-w-md leading-relaxed mb-8">
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
            className="bg-ambi-surface border border-ambi-border rounded-full px-4 py-1.5 text-sm text-ambi-muted shadow-sm"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-ambi-muted text-sm mt-10 opacity-70">
        ← Upload a file in the sidebar to get started
      </p>
    </div>
  )
}
