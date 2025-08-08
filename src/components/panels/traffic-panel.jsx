
import { useEffect, useState } from "react"
import { Toggle } from "@/components/ui/toggle"
import { TrafficCone } from 'lucide-react'

export default function TrafficPanel({ showTraffic = true, onToggle = () => {} }) {
  const [congestion, setCongestion] = useState("Medium")

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.random()
      setCongestion(r < 0.5 ? "Low" : r < 0.8 ? "Medium" : "High")
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const color = congestion === "Low" ? "#00FFF7" : congestion === "Medium" ? "#FFC300" : "#FF1744"

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[#E0FFFF]/70">Congestion Level</div>
        <Toggle pressed={showTraffic} onPressedChange={onToggle} className="data-[state=on]:bg-[#00FFF7]/20">
          {showTraffic ? "On" : "Off"}
        </Toggle>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} aria-label={`Traffic Level ${congestion}`} />
        <div className="text-lg font-semibold" style={{ color }}>{congestion}</div>
      </div>
      <div className="mt-3 text-xs text-[#E0FFFF]/60 flex items-center gap-2">
        <TrafficCone className="text-[#1F51FF]" />
        Live traffic overlay is simulated unless Google Maps API key is provided.
      </div>
    </div>
  )
}
