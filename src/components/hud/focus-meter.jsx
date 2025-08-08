
export default function FocusMeter({ value = 80 }) {
  const clamped = Math.max(0, Math.min(100, value))
  const stroke = 12
  const size = 180
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c
  const color = clamped >= 60 ? "#00FFF7" : clamped >= 35 ? "#FFC300" : "#FF1744"

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="drop-shadow-[0_0_10px_rgba(0,255,247,0.4)]">
        <defs>
          <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00FFF7" />
            <stop offset="100%" stopColor="#1F51FF" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(224,255,255,0.15)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            filter: "drop-shadow(0 0 6px rgba(0,255,247,0.6))",
            transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
          }}
        />
      </svg>
      <div className="mt-3 text-center">
        <div className="text-xl font-semibold" style={{ color: "#E0FFFF" }}>
          Focus {clamped}%
        </div>
        <div className="text-xs text-[#E0FFFF]/70">Driver attention level</div>
      </div>
    </div>
  )
}
