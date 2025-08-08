
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from 'lucide-react'

export default function VoiceAssistant({ onCommand = () => {}, tts = true, buttonClass = "" }) {
  const [active, setActive] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.lang = "en-US"
      rec.continuous = false
      rec.interimResults = false
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript.toLowerCase().trim()
        handleTranscript(transcript)
      }
      rec.onend = () => setActive(false)
      recognitionRef.current = rec
    }
  }, [])

  const handleTranscript = useCallback(
    (text) => {
      const matched = ["show weather", "show traffic", "alert test"].find((k) => text.includes(k))
      const cmd = matched || text
      if (tts) {
        try {
          const settings = JSON.parse(localStorage.getItem("ai-copilot:settings") || "{}")
          if (settings.voicePrompt !== false) {
            const utter = new SpeechSynthesisUtterance(
              matched === "alert test" ? "Triggering alert test" : matched ? `Okay, ${matched}` : "Command received"
            )
            utter.rate = 1.1
            speechSynthesis.speak(utter)
          }
        } catch {}
      }
      onCommand(cmd)
    },
    [onCommand, tts]
  )

  const toggle = () => {
    if (!recognitionRef.current) return
    if (active) {
      recognitionRef.current.stop()
      setActive(false)
    } else {
      try {
        recognitionRef.current.start()
        setActive(true)
      } catch {}
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className={buttonClass}>
      {active ? <Mic /> : <MicOff />}
      <span className="sr-only">Toggle Voice Assistant</span>
    </Button>
  )
}
