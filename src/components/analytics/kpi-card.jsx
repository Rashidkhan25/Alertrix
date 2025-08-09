
import { Card } from "@/components/ui/card"

export default function KpiCard({ title = "Metric", value = "--", hint = "", right = null }) {
  return (
    <Card
      className="p-4 border rounded-lg"
      style={{
        background: "#1A1A1D",
        boxShadow: "0 0 10px rgba(0,255,247,0.15), inset 0 0 24px rgba(31,81,255,0.08)",
        borderColor: "rgba(0,255,247,0.15)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-[#E0FFFF]/60">{title}</div>
          <div className="text-2xl font-semibold mt-1" style={{ color: "#E0FFFF" }}>{value}</div>
          {hint ? <div className="text-xs text-[#E0FFFF]/60 mt-1">{hint}</div> : null}
        </div>
        {right}
      </div>
    </Card>
  )
}
