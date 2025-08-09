
import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Map, CloudSun, Webcam, BellRing, Gauge } from 'lucide-react'
import Speedometer3D from "@/components/hud/speedometer-3d"
import FocusMeter from "@/components/hud/focus-meter"
import WeatherPanel from "@/components/panels/weather-panel"
import TrafficPanel from "@/components/panels/traffic-panel"
import TimePanel from "@/components/panels/time-panel"
import NavigationMap from "@/components/map/navigation-map"
import VoiceAssistant from "@/components/voice/voice-assistant"
import AlertsDisplay from "@/components/alerts/alerts-display"
import WebcamPreview from "@/components/media/webcam-preview"
import TopNav from "@/components/layout/top-nav"
import WeatherFX from "@/components/visuals/weather-fx"
import WeatherBackground from "@/components/visuals/weather-background"
import MusicPlayer from "@/components/voice/Music-player";

export default function DashboardPage() {
  const [speed, setSpeed] = useState(48)
  const [focus, setFocus] = useState(82)
  const musicPlayerRef = useRef(null);
  const [showTraffic, setShowTraffic] = useState(true)
  const [expandWeather, setExpandWeather] = useState(true)
  const [alerts, setAlerts] = useState([])
  const [weatherKind, setWeatherKind] = useState("clear")
  // Default to black background on first load
  const [useDarkBackground, setUseDarkBackground] = useState(true)

  useEffect(() => {
    const load = () => {
      try {
        const s = JSON.parse(localStorage.getItem("ai-copilot:settings") || "{}")
        // Support new backgroundMode and legacy boolean
        if (s?.backgroundMode) {
          setUseDarkBackground(s.backgroundMode === "black")
        } else {
          setUseDarkBackground(s?.useDarkBackground !== false) // default true
        }
      } catch {}
    }
    load()
    const onStorage = (e) => {
      if (e.key === "ai-copilot:settings") load()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setSpeed((s) => Math.round(Math.max(0, Math.min(160, s + (Math.random() * 12 - 6)))))
      setFocus((f) => Math.round(Math.max(0, Math.min(100, f + (Math.random() * 8 - 4)))))
    }, 1400)
    return () => clearInterval(id)
  }, [])

  const handleCommand = (cmd) => {
    if (cmd === "show weather") setExpandWeather(true)
    if (cmd === "show traffic") setShowTraffic(true)
    if (cmd === "alert test") {
      triggerAlert({
        id: Date.now().toString(),
        type: "drowsiness",
        message: "Drowsiness detected: Take a break",
        severity: "high",
        time: new Date().toLocaleTimeString(),
      })
    }
  }

  const triggerAlert = (alert) => setAlerts((prev) => [alert, ...prev].slice(0, 5))

  const lastLowRef = useRef(0)
  useEffect(() => {
    if (focus < 35 && Date.now() - lastLowRef.current > 15000) {
      lastLowRef.current = Date.now()
      triggerAlert({
        id: Date.now().toString(),
        type: "drowsiness",
        message: "Low focus level detected",
        severity: "high",
        time: new Date().toLocaleTimeString(),
      })
    } else if (focus < 55 && Math.random() < 0.12) {
      triggerAlert({
        id: Date.now().toString(),
        type: "warning",
        message: "Keep your eyes on the road",
        severity: "medium",
        time: new Date().toLocaleTimeString(),
      })
    }
  }, [focus])

  const handleWeatherKind = useCallback((k) => setWeatherKind(k), [])
  const hours = new Date().getHours()
  const isDay = hours >= 7 && hours < 19

  const panelStyle = {
    background: "#1A1A1D",
    boxShadow: "0 0 10px rgba(0,255,247,0.15), inset 0 0 24px rgba(31,81,255,0.08)",
    borderColor: "rgba(0,255,247,0.15)",
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {useDarkBackground ? (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#0B0C10" }}
        />
      ) : (
        <>
          <WeatherBackground condition={weatherKind} day={isDay} />
          <WeatherFX condition={weatherKind} intensity={1} />
        </>
      )}

      <TopNav />

      <motion.main
        className="relative z-10 mx-auto w-full max-w-[1400px] flex-1 px-4 py-4 md:py-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-4 lg:col-span-1">
            <Card className="p-4" style={panelStyle}>
              <div className="flex items-center gap-2 mb-3 text-[#E0FFFF]">
                <CloudSun className="text-[#00FFF7]" />
                <h3 className="font-semibold">Weather</h3>
              </div>
              <WeatherPanel
                expanded={expandWeather}
                onToggle={() => setExpandWeather((x) => !x)}
                onWeatherChange={handleWeatherKind}
              />
            </Card>

            <Card className="p-4" style={panelStyle}>
              <div className="flex items-center gap-2 mb-3 text-[#E0FFFF]">
                <Map className="text-[#00FFF7]" />
                <h3 className="font-semibold">Traffic Conditions</h3>
              </div>
              <TrafficPanel
                showTraffic={showTraffic}
                onToggle={() => setShowTraffic((x) => !x)}
              />
            </Card>

            <Card className="p-4" style={panelStyle}>
              <div className="flex items-center gap-2 mb-3 text-[#E0FFFF]">
                <Gauge className="text-[#00FFF7]" />
                <h3 className="font-semibold">Date & Time</h3>
              </div>
              <TimePanel />
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4" style={panelStyle}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <Speedometer3D speed={speed} maxSpeed={160} />
                </div>
                <div className="md:col-span-1">
                  <FocusMeter value={focus} />
                </div>
              </div>
            </Card>

            <Card className="p-4" style={panelStyle}>
              <div className="flex items-center gap-2 mb-3 text-[#E0FFFF]">
                <Webcam className="text-[#00FFF7]" />
                <h3 className="font-semibold">
                  Driver Avatar (Face Tracking Placeholder)
                </h3>
              </div>
              <WebcamPreview
                onFocusChange={setFocus}
                onDrowsinessAlert={triggerAlert}
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-4 h-full" style={panelStyle}>
              <div className="flex items-center gap-2 mb-3 text-[#E0FFFF]">
                <Map className="text-[#00FFF7]" />
                <h3 className="font-semibold">Navigation</h3>
              </div>
              <div className="space-y-3">
                <NavigationMap showTraffic={showTraffic} />
                <p className="text-xs text-[#E0FFFF]/80">
                  Live traffic requires a Google Maps API key in Settings.
                  Without it, traffic is simulated.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </motion.main>

      <footer
        className="z-10 sticky bottom-0 border-t border-white/10 backdrop-blur"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,12,16,0.75), rgba(10,12,16,0.95))",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VoiceAssistant musicPlayerRef={musicPlayerRef} />
            <span className="text-sm text-[#E0FFFF]/80">Voice Assistant</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[#E0FFFF]/90">
            <MusicPlayer ref={musicPlayerRef} />
          </div>
          <div className="flex items-center gap-2">
            <BellRing className="text-[#FFC300]" />
            <span className="text-sm text-[#E0FFFF]/90">Active Alerts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
