
import { useEffect, useState } from "react"

export default function TimePanel() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-[#E0FFFF]">
      <div className="text-2xl font-semibold">{now.toLocaleTimeString()}</div>
      <div className="text-sm text-[#E0FFFF]/70">{now.toLocaleDateString()}</div>
    </div>
  )
}
