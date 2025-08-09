
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function WeatherPanel({
  expanded = true,
  onToggle = () => {},
  onWeatherChange = () => {},
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [kind, setKind] = useState("clear")

  useEffect(() => {
    let mounted = true
    async function fetchWeather() {
      try {
        setLoading(true)
        setError(null)
        const settings = JSON.parse(localStorage.getItem("ai-copilot:settings") || "{}")
        const owmKey = settings?.owmKey || ""
        const pos = await getPosition()
        const lat = pos?.coords?.latitude ?? 37.7749
        const lon = pos?.coords?.longitude ?? -122.4194

        if (owmKey) {
          const resp = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${owmKey}`
          )
          if (!resp.ok) throw new Error("OpenWeatherMap error")
          const json = await resp.json()
          const main = (json.weather?.[0]?.main || "").toLowerCase()
          const d = {
            tempC: Math.round(json.main.temp),
            description: json.weather?.[0]?.description ?? "Weather",
            main: json.weather?.[0]?.main,
            icon: `https://openweathermap.org/img/wn/${json.weather?.[0]?.icon ?? "01d"}@2x.png`,
            sunrise: json.sys?.sunrise ? new Date(json.sys.sunrise * 1000).toLocaleTimeString() : undefined,
            sunset: json.sys?.sunset ? new Date(json.sys.sunset * 1000).toLocaleTimeString() : undefined,
            location: json.name ?? "Current Location",
          }
          if (mounted) {
            setData(d)
            const k = normalizeOWMMain(main)
            setKind(k)
            onWeatherChange(k)
          }
        } else {
          const resp = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset&timezone=auto`
          )
          if (!resp.ok) throw new Error("Open-Meteo error")
          const json = await resp.json()
          const code = json.current_weather?.weathercode
          const d = {
            tempC: Math.round(json.current_weather?.temperature ?? 20),
            description: codeToDesc(code),
            icon: codeToIcon(code),
            sunrise: json.daily?.sunrise?.[0] ? new Date(json.daily.sunrise[0]).toLocaleTimeString() : undefined,
            sunset: json.daily?.sunset?.[0] ? new Date(json.daily.sunset[0]).toLocaleTimeString() : undefined,
            location: "Current Location",
          }
          if (mounted) {
            setData(d)
            const k = normalizeOpenMeteo(code)
            setKind(k)
            onWeatherChange(k)
          }
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Weather error")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchWeather()
    const id = setInterval(fetchWeather, 90000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, []) // intentionally no onWeatherChange dep

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          {data?.icon ? (
            <img src={data.icon || "/placeholder.svg?height=48&width=48&query=openweathermap-icon"} alt={data.description} width={48} height={48} className="rounded" />
          ) : (
            <div className="w-12 h-12 rounded bg-white/10" />
          )}
          <div>
            <div className="text-xl font-semibold" style={{ color: "#E0FFFF" }}>
              {data ? `${data.tempC}°C` : loading ? "..." : "--"}
            </div>
            <div className="text-xs text-[#E0FFFF]/70 capitalize">{data?.description ?? "Loading weather..."}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-[#E0FFFF] hover:text-[#00FFF7]">
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      <div className="mt-1 text-xs">
        <span
          className="inline-block rounded px-2 py-0.5"
          style={{
            color: "#0B0C10",
            background:
              kind === "rain" || kind === "thunderstorm"
                ? "#00FFF7"
                : kind === "snow"
                ? "#E0FFFF"
                : kind === "fog" || kind === "clouds"
                ? "#FFC300"
                : "#1F51FF",
            boxShadow: "0 0 8px rgba(0,255,247,0.5)",
          }}
        >
          Condition: {kind}
        </span>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-2 text-sm text-[#E0FFFF]/80">
          <div>
            <div className="opacity-70">Sunrise</div>
            <div>{data?.sunrise ?? "--"}</div>
          </div>
          <div>
            <div className="opacity-70">Sunset</div>
            <div>{data?.sunset ?? "--"}</div>
          </div>
          <div className="col-span-2">
            <div className="opacity-70">Location</div>
            <div>{data?.location ?? "Unknown"}</div>
          </div>
          {error ? <div className="col-span-2 text-[#FF1744]">Error: {error}</div> : null}
        </div>
      )}
    </div>
  )
}

function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  })
}

function normalizeOWMMain(main) {
  const m = (main || "").toLowerCase()
  if (m.includes("thunder")) return "thunderstorm"
  if (m.includes("drizzle")) return "drizzle"
  if (m.includes("rain")) return "rain"
  if (m.includes("snow")) return "snow"
  if (m.includes("fog") || m.includes("mist") || m.includes("haze") || m.includes("smoke") || m.includes("dust")) return "fog"
  if (m.includes("cloud")) return "clouds"
  if (m.includes("clear")) return "clear"
  return "clear"
}

function codeToDesc(code) {
  const map = {
    0: "clear sky",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "depositing rime fog",
    51: "light drizzle",
    53: "drizzle",
    55: "dense drizzle",
    61: "rain",
    63: "rain",
    65: "heavy rain",
    71: "snow",
    73: "snow",
    75: "heavy snow",
    95: "thunderstorm",
  }
  return map[code ?? 0] ?? "weather"
}

function normalizeOpenMeteo(code) {
  if (code === undefined || code === null) return "clear"
  if ([0, 1].includes(code)) return "clear"
  if ([2, 3].includes(code)) return "clouds"
  if ([45, 48].includes(code)) return "fog"
  if ([51, 53, 55].includes(code)) return "drizzle"
  if ([61, 63, 65].includes(code)) return "rain"
  if ([71, 73, 75].includes(code)) return "snow"
  if ([95].includes(code)) return "thunderstorm"
  return "clear"
}

function codeToIcon(_code) {
  return "/glowing-weather-icon.png"
}

export async function getWeatherSummary() {
  try {
    const settings = JSON.parse(
      localStorage.getItem("ai-copilot:settings") || "{}"
    );
    const owmKey = settings?.owmKey || "";
    const pos = await getPosition();
    const lat = pos?.coords?.latitude ?? 37.7749;
    const lon = pos?.coords?.longitude ?? -122.4194;

    // Get city name from coords:
    const cityName = await getCityFromCoords(lat, lon);

    if (owmKey) {
      const resp = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${owmKey}`
      );
      if (!resp.ok) throw new Error("OpenWeatherMap error");
      const json = await resp.json();
      const temp = Math.round(json.main.temp);
      const desc = json.weather?.[0]?.description ?? "weather";

      return `The weather in ${cityName} is currently ${desc} with a temperature of ${temp} degrees Celsius.`;
    } else {
      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      );
      if (!resp.ok) throw new Error("Open-Meteo error");
      const json = await resp.json();
      const temp = Math.round(json.current_weather?.temperature ?? 20);
      const desc = "clear sky";

      return `The weather in ${cityName} is currently ${desc} with a temperature of ${temp} degrees Celsius.`;
    }
  } catch (error) {
    return "Sorry, I could not fetch the weather right now.";
  }
}


async function getCityFromCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    if (!response.ok) throw new Error("Reverse geocoding failed");
    const data = await response.json();
    return (
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.county ||
      "your location"
    );
  } catch {
    return "your location";
  }
}
