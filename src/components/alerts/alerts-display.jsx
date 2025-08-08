
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Siren, AlertTriangle, TicketIcon as Seatbelt } from 'lucide-react'

export default function AlertsDisplay({ alerts = [] }) {
  const isCritical = alerts.some((a) => a.severity === "high")

  useEffect(() => {
    if (isCritical && "vibrate" in navigator) {
      navigator.vibrate([80, 60, 80])
    }
    if (isCritical) {
      const el = document.getElementById("root") || document.body
      el.classList.add("alert-border")
      const t = setTimeout(() => el.classList.remove("alert-border"), 1800)
      return () => clearTimeout(t)
    }
  }, [isCritical])

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded px-3 py-2 flex items-center gap-2"
            style={{
              background: "rgba(31,81,255,0.08)",
              border: "1px solid rgba(0,255,247,0.15)",
              boxShadow: "0 0 12px rgba(0,255,247,0.1)",
            }}
          >
            <AlertIcon type={a.type} severity={a.severity} />
            <div className="text-sm" style={{ color: "#E0FFFF" }}>
              {a.message}
              <span className="ml-2 opacity-70">[{a.time}]</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .alert-border {
            animation: borderPulse 0.8s ease-in-out 2;
          }
          @keyframes borderPulse {
            0% { box-shadow: 0 0 0 0 rgba(255,23,68,0.0) inset; }
            50% { box-shadow: 0 0 0 8px rgba(255,23,68,0.5) inset; }
            100% { box-shadow: 0 0 0 0 rgba(255,23,68,0.0) inset; }
          }
        `,
        }}
      />
    </div>
  )
}

function AlertIcon({ type, severity }) {
  const color = severity === "high" ? "#FF1744" : severity === "medium" ? "#FFC300" : "#00FFF7"
  const style = { color, filter: `drop-shadow(0 0 6px ${color})` }
  if (type === "drowsiness") return <Siren style={style} />
  if (type === "seatbelt") return <Seatbelt style={style} />
  return <AlertTriangle style={style} />
}
