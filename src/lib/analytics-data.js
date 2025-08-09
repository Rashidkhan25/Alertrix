export function generateTripSeries({ hours = 24, stepMinutes = 10, seed = Date.now() } = {}) {
  let s = seed % 2147483647
  const rand = () => (s = (s * 48271) % 2147483647) / 2147483647

  const points = []
  const steps = Math.max(1, Math.floor((hours * 60) / stepMinutes))
  let distanceKm = 0

  for (let i = 0; i < steps; i++) {
    const tMin = i * stepMinutes
    const tHour = tMin / 60
    const speed = Math.max(0, Math.round(50 + Math.sin(tHour * 0.8) * 18 + (rand() - 0.5) * 20))
    const focus = Math.max(0, Math.min(100, Math.round(72 - Math.sin(tHour * 0.6) * 12 + (rand() - 0.5) * 18)))

    let alert = null
    const alertChance = (focus < 55 ? 0.09 : 0.03) + (speed > 110 ? 0.04 : 0)
    if (rand() < alertChance) {
      const types = ["Drowsiness", "Distraction", "Speeding", "Seatbelt"]
      const type = types[Math.floor(rand() * types.length)]
      const severity = rand() < 0.6 ? "medium" : "high"
      alert = { type, severity }
    }

    const km = (speed * (stepMinutes / 60))
    distanceKm += km

    const timestamp = Date.now() - (steps - i) * stepMinutes * 60000
    points.push({
      t: i,
      time: new Date(timestamp),
      speed,
      focus,
      distanceKm: +distanceKm.toFixed(2),
      alert,
    })
  }

  return points
}

export function computeStats(series) {
  if (!series?.length) {
    return {
      avgSpeed: 0, maxSpeed: 0, avgFocus: 0, totalDistance: 0,
      alertCount: 0, alertTypeCounts: {}, alertsTimeline: [],
      scatter: [], speedSeries: [], focusSeries: []
    }
  }
  const n = series.length
  let sumSpeed = 0
  let sumFocus = 0
  let maxSpeed = 0
  let alertCount = 0
  const alertTypeCounts = {}
  const alertsTimelineMap = new Map()
  const scatter = []

  for (const p of series) {
    sumSpeed += p.speed
    sumFocus += p.focus
    maxSpeed = Math.max(maxSpeed, p.speed)
    if (p.alert) {
      alertCount++
      alertTypeCounts[p.alert.type] = (alertTypeCounts[p.alert.type] || 0) + 1
      const label = p.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      alertsTimelineMap.set(label, (alertsTimelineMap.get(label) || 0) + 1)
    }
    scatter.push({ speed: p.speed, focus: p.focus })
  }

  const alertsTimeline = Array.from(alertsTimelineMap.entries()).map(([time, count]) => ({ time, count }))
  alertsTimeline.sort((a, b) => a.time.localeCompare(b.time))

  return {
    avgSpeed: +(sumSpeed / n).toFixed(1),
    maxSpeed,
    avgFocus: +(sumFocus / n).toFixed(1),
    totalDistance: +series[series.length - 1].distanceKm.toFixed(2),
    alertCount,
    alertTypeCounts,
    alertsTimeline,
    scatter,
    speedSeries: series.map(p => ({ t: p.t, label: p.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), speed: p.speed })),
    focusSeries: series.map(p => ({ t: p.t, label: p.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), focus: p.focus })),
  }
}

export function toCsv(series) {
  const headers = ["index", "isoTime", "speed", "focus", "distanceKm", "alertType", "alertSeverity"]
  const rows = [headers.join(",")]
  for (let i = 0; i < series.length; i++) {
    const p = series[i]
    rows.push([
      i,
      p.time.toISOString(),
      p.speed,
      p.focus,
      p.distanceKm,
      p.alert?.type ?? "",
      p.alert?.severity ?? "",
    ].join(","))
  }
  return rows.join("\n")
}
