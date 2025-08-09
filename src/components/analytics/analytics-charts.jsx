
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

const panelStyle = {
  background: "#1A1A1D",
  boxShadow: "0 0 10px rgba(0,255,247,0.15), inset 0 0 24px rgba(31,81,255,0.08)",
  borderColor: "rgba(0,255,247,0.15)",
}

export default function AnalyticsCharts({ stats }) {
  const speedSeries = Array.isArray(stats?.speedSeries) ? stats.speedSeries : []
  const focusSeries = Array.isArray(stats?.focusSeries) ? stats.focusSeries : []
  const alertsByType = Object.entries(stats?.alertTypeCounts || {}).map(([type, count]) => ({ type, count }))
  const alertsTimeline = Array.isArray(stats?.alertsTimeline) ? stats.alertsTimeline : []

  // Minimal, readable axes and thicker strokes to reduce clutter
  const xTick = { fill: "#E0FFFF", fontSize: 12 }
  const yTick = { fill: "#E0FFFF", fontSize: 12 }
  const grid = "rgba(224,255,255,0.12)"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Speed over Time */}
      <Card className="p-4" style={panelStyle}>
        <h3 className="text-[#E0FFFF] mb-3">{"Speed over Time (km/h)"}</h3>
        <ChartContainer
          config={{
            speed: { label: "Speed", color: "hsl(var(--chart-1))" },
          }}
          className="h-[340px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedSeries}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="label" tick={xTick} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={yTick} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Legend />
              <Line type="monotone" dataKey="speed" stroke="var(--color-speed)" strokeWidth={2.6} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Focus over Time */}
      <Card className="p-4" style={panelStyle}>
        <h3 className="text-[#E0FFFF] mb-3">{"Focus over Time (%)"}</h3>
        <ChartContainer
          config={{
            focus: { label: "Focus", color: "hsl(var(--chart-2))" },
          }}
          className="h-[340px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focusSeries}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="label" tick={xTick} interval="preserveStartEnd" minTickGap={24} />
              <YAxis domain={[0, 100]} tick={yTick} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area type="monotone" dataKey="focus" stroke="var(--color-focus)" fill="var(--color-focus)" fillOpacity={0.22} strokeWidth={2.4} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Alerts by Type */}
      <Card className="p-4" style={panelStyle}>
        <h3 className="text-[#E0FFFF] mb-3">{"Alerts by Type"}</h3>
        <ChartContainer
          config={{
            count: { label: "Count", color: "hsl(var(--chart-4))" },
          }}
          className="h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertsByType}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="type" tick={xTick} />
              <YAxis allowDecimals={false} tick={yTick} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Alerts Timeline */}
      <Card className="p-4" style={panelStyle}>
        <h3 className="text-[#E0FFFF] mb-3">{"Alerts Timeline"}</h3>
        <ChartContainer
          config={{
            count: { label: "Count", color: "hsl(var(--chart-5))" },
          }}
          className="h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertsTimeline}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="time" tick={xTick} interval="preserveStartEnd" minTickGap={20} />
              <YAxis allowDecimals={false} tick={yTick} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>
    </div>
  )
}
