
export default function Sparkline({ data = [], dataKey = "value", color = "#00FFF7" }) {
  const w = 120
  const h = 44
  if (!data?.length) {
    return <div className="h-[44px] w-[120px] text-xs text-[#E0FFFF]/60 flex items-center justify-center">--</div>
  }
  const values = data.map((d) => Number(d[dataKey] ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const stepX = values.length > 1 ? w / (values.length - 1) : w

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = h - ((v - min) / range) * (h - 4) - 2
    return [x, y]
  })

  const path = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  )
}
