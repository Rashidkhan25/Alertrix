
export default function WeatherBackground({ condition = "clear", day = true, className = "" }) {
  const bg = getBackground(condition, day)
  return (
    <div
      className={["absolute inset-0", className].join(" ")}
      style={{ background: bg, transition: "background 600ms ease" }}
      aria-hidden="true"
    />
  )
}

function getBackground(condition, day) {
  const DAY = "linear-gradient(#FFD89B, #19547B)"
  const NIGHT = "linear-gradient(#0F2027, #203A43, #2C5364)"
  const CLOUDY_DAY = "linear-gradient(180deg, #a0b3c0 0%, #6d7b84 100%)"
  const CLOUDY_NIGHT = "linear-gradient(180deg, #3b474f 0%, #1e262b 100%)"
  const RAIN = "linear-gradient(180deg, #2b5876 0%, #4e4376 100%)"
  const DRIZZLE = "linear-gradient(180deg, #5f9ea0 0%, #3b6e79 100%)"
  const SNOW = "linear-gradient(180deg, #e0ffff 0%, #a8c6ff 100%)"
  const FOG = "linear-gradient(180deg, #bdc3c7 0%, #95a5a6 100%)"
  const STORM = "linear-gradient(180deg, #141e30 0%, #243b55 100%)"

  switch (condition) {
    case "clear":
      return day ? DAY : NIGHT
    case "clouds":
      return day ? CLOUDY_DAY : CLOUDY_NIGHT
    case "rain":
      return RAIN
    case "drizzle":
      return DRIZZLE
    case "snow":
      return SNOW
    case "fog":
      return FOG
    case "thunderstorm":
      return STORM
    default:
      return day ? DAY : NIGHT
  }
}
