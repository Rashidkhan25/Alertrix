
import { useEffect, useRef } from "react"

export default function WeatherFX({ condition = "clear", intensity = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = canvas.clientWidth
    let height = canvas.clientHeight
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const displayWidth = Math.max(1, Math.floor(width * dpr))
      const displayHeight = Math.max(1, Math.floor(height * dpr))
      canvas.width = displayWidth
      canvas.height = displayHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const onWinResize = () => resize()
    window.addEventListener("resize", onWinResize)

    let particles = []
    const countBase = Math.floor(180 * intensity)

    function initParticles(kind) {
      particles = []
      const count = kind === "snow" ? countBase / 2 : countBase
      for (let i = 0; i < count; i++) {
        if (kind === "rain" || kind === "drizzle" || kind === "thunderstorm") {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            len: 8 + Math.random() * 14,
            speed: 4 + Math.random() * (kind === "drizzle" ? 2 : 6),
            tilt: 0.9 + Math.random() * 0.2,
          })
        } else if (kind === "snow") {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 1 + Math.random() * 2.2,
            speed: 0.4 + Math.random() * 0.9,
            drift: -0.5 + Math.random(),
          })
        }
      }
    }

    initParticles(condition)

    function drawSun() {
      const cx = width - 120
      const cy = 120
      const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, 60)
      grd.addColorStop(0, "rgba(255, 225, 150, 0.9)")
      grd.addColorStop(1, "rgba(255, 200, 0, 0.0)")
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(cx, cy, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "rgba(255, 215, 0, 0.25)"
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2
        const x1 = cx + Math.cos(angle) * 40
        const y1 = cy + Math.sin(angle) * 40
        const x2 = cx + Math.cos(angle) * 100
        const y2 = cy + Math.sin(angle) * 100
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }

    function drawFog() {
      const grd = ctx.createLinearGradient(0, 0, 0, height)
      grd.addColorStop(0, "rgba(200, 200, 200, 0.05)")
      grd.addColorStop(1, "rgba(200, 200, 200, 0.12)")
      ctx.fillStyle = grd
      ctx.fillRect(0, height * 0.65, width, height * 0.35)
    }

    let rafId = null
    function render() {
      ctx.clearRect(0, 0, width, height)

      if (condition === "rain" || condition === "drizzle" || condition === "thunderstorm") {
        ctx.strokeStyle = "rgba(224,255,255,0.7)"
        ctx.lineWidth = 1.2
        for (const p of particles) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.tilt * 2, p.y + p.len)
          ctx.stroke()
          p.x += p.tilt * 2
          p.y += p.speed
          if (p.y > height) {
            p.y = -10
            p.x = Math.random() * width
          }
        }
        if (condition === "thunderstorm" && Math.random() < 0.02) {
          ctx.fillStyle = "rgba(255,255,255,0.12)"
          ctx.fillRect(0, 0, width, height)
        }
      } else if (condition === "snow") {
        ctx.fillStyle = "rgba(224,255,255,0.95)"
        for (const p of particles) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
          p.y += p.speed
          p.x += p.drift * 0.5
          if (p.y > height) {
            p.y = -5
            p.x = Math.random() * width
          }
        }
      } else if (condition === "clear") {
        drawSun()
      } else if (condition === "fog" || condition === "clouds") {
        drawFog()
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener("resize", onWinResize)
    }
  }, [condition, intensity])

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-20"
      style={{ mixBlendMode: "screen", width: "100vw", height: "100vh" }}
      aria-hidden="true"
    />
  )
}
