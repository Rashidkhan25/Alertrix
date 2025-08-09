
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import KpiCard from "@/components/analytics/kpi-card"
import ErrorBoundary from "@/components/util/error-boundary"
import { generateTripSeries, computeStats, toCsv } from "@/lib/analytics-data"
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

export default function AnalyticsApp() {
  // Static (non-live) analytics with range selector only
  const [range, setRange] = useState(6)
  const [seed] = useState(() => Math.floor(Math.random() * 1e9))

  const series = useMemo(() => generateTripSeries({ hours: range, seed }), [range, seed])
  const stats = useMemo(() => computeStats(series), [series])

  function exportCsv() {
    const csv = toCsv(series)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${range}h.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const xTick = { fill: "#E0FFFF", fontSize: 12 }
  const yTick = { fill: "#E0FFFF", fontSize: 12 }
  const grid = "rgba(224,255,255,0.12)"
  const speedTickFmt = (v) => String(v)
  const focusTickFmt = (v) => `${v}%`

  return (
    <motion.div
      className="mx-auto max-w-[1200px] px-4 py-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#E0FFFF" }}>
          {"Trip Analytics"}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={range === 6 ? "default" : "outline"}
            onClick={() => setRange(6)}
            style={range === 6 ? { background: "linear-gradient(90deg,#00FFF7,#1F51FF)", color: "#0B0C10" } : {color: "#ffffff"}}
          >
            {"6h"}
          </Button>
          <Button
            variant={range === 3 ? "default" : "outline"}
            onClick={() => setRange(3)}
            style={range === 3 ? { background: "linear-gradient(90deg,#00FFF7,#1F51FF)", color: "#0B0C10" } : {color: "#ffffff"}}
          >
            {"3h"}
          </Button>
          <Button
            variant={range === 1 ? "default" : "outline"}
            onClick={() => setRange(1)}
            style={range === 1 ? { background: "linear-gradient(90deg,#00FFF7,#1F51FF)", color: "#0B0C10" } : {color: "#ffffff"}}
          >
            {"1h"}
          </Button>
          <Button onClick={exportCsv} style={{ background: "#00FFF7", color: "#0B0C10" }}>
            {"Export CSV"}
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Total Distance" value={`${stats.totalDistance} km`} hint="Estimated over selected range" />
          <KpiCard title="Avg Speed" value={`${stats.avgSpeed} km/h`} hint="Across all samples" />
          <KpiCard title="Max Speed" value={`${stats.maxSpeed} km/h`} hint="Peak value" />
          <KpiCard title="Avg Focus" value={`${stats.avgFocus}%`} hint="Driver attention level" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Speed over Time */}
          <Card className="p-4" style={panelStyle}>
            <h3 className="text-[#E0FFFF] mb-3">{"Speed over Time (km/h)"}</h3>
            <ChartContainer
              config={{
                speed: { label: "Speed", color: "#00FFF7" }, // explicit color for CSS var
              }}
              className="h-[340px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.speedSeries}>
                  <CartesianGrid stroke={grid} />
                  <XAxis
                    dataKey="label"
                    tick={xTick}
                    interval={0}
                    tickFormatter={(v, i) => (i % 4 === 0 ? v : "")}
                  />
                  <YAxis tick={yTick} tickFormatter={speedTickFmt} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    stroke={"var(--color-speed, #00FFF7)"} // fallback to visible neon cyan
                    strokeWidth={2.6}
                    dot={false}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Focus over Time */}
          <Card className="p-4" style={panelStyle}>
            <h3 className="text-[#E0FFFF] mb-3">{"Focus over Time (%)"}</h3>
            <ChartContainer
              config={{
                focus: { label: "Focus", color: "#1F51FF" }, // explicit color
              }}
              className="h-[340px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.focusSeries}>
                  <CartesianGrid stroke={grid} />
                  <XAxis
                    dataKey="label"
                    tick={xTick}
                    interval={0}
                    tickFormatter={(v, i) => (i % 4 === 0 ? v : "")}
                  />
                  <YAxis domain={[0, 100]} tick={yTick} tickFormatter={focusTickFmt} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="focus"
                    stroke={"var(--color-focus, #1F51FF)"}
                    fill={"var(--color-focus, #1F51FF)"}
                    fillOpacity={0.22}
                    strokeWidth={2.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Alerts by Type */}
          <Card className="p-4" style={panelStyle}>
            <h3 className="text-[#E0FFFF] mb-3">{"Alerts by Type"}</h3>
            <ChartContainer
              config={{
                count: { label: "Count", color: "#FFC300" }, // explicit color
              }}
              className="h-[320px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats.alertTypeCounts || {}).map(([type, count]) => ({ type, count }))}>
                  <CartesianGrid stroke={grid} />
                  <XAxis dataKey="type" tick={xTick} />
                  <YAxis allowDecimals={false} tick={yTick} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="count" fill={"var(--color-count, #FFC300)"} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Alerts Timeline */}
          <Card className="p-4" style={panelStyle}>
            <h3 className="text-[#E0FFFF] mb-3">{"Alerts Timeline"}</h3>
            <ChartContainer
              config={{
                count: { label: "Count", color: "#FFC300" }, // explicit color
              }}
              className="h-[320px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.alertsTimeline}>
                  <CartesianGrid stroke={grid} />
                  <XAxis
                    dataKey="time"
                    tick={xTick}
                    interval={0}
                    tickFormatter={(v, i) => (i % 3 === 0 ? v : "")}
                  />
                  <YAxis allowDecimals={false} tick={yTick} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="count" fill={"var(--color-count, #FFC300)"} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>
      </ErrorBoundary>
    </motion.div>
  )
}
