
import { useEffect, useRef, useState } from "react"

export default function WebcamPreview() {
  const ref = useRef(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    async function run() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (ref.current) {
          ref.current.srcObject = stream
          await ref.current.play()
          setOk(true)
        }
      } catch {
        setOk(false)
      }
    }
    run()
  }, [])

  if (!ok) {
    return (
      <img
        src="/driver-avatar-placeholder-neon-glow.png"
        alt="Driver avatar placeholder"
        className="w-full h-[220px] object-cover rounded"
      />
    )
  }

  return <video ref={ref} className="w-full h-[220px] object-cover rounded" muted playsInline />
}
