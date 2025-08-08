
import { useEffect, useMemo, useState } from "react"
import { Map, Marker, Overlay } from "pigeon-maps"

// OSM tile provider
const osm = (x, y, z, dpr) =>
  `https://{s}.tile.openstreetmap.org/${z}/${x}/${y}.png`.replace("{s}", "a")

export default function NavigationMap({ showTraffic = true }) {
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 })

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  // Simulated traffic "hotspots" as neon dots around the center
  const trafficDots = useMemo(() => {
    return Array.from({ length: 12 }).map(() => {
      const dLat = (Math.random() - 0.5) * 0.02
      const dLng = (Math.random() - 0.5) * 0.02
      const lat = center.lat + dLat
      const lng = center.lng + dLng
      const sev = Math.random()
      const color = sev < 0.5 ? "#00FFF7" : sev < 0.8 ? "#FFC300" : "#FF1744"
      const size = 10 + Math.random() * 12
      return { lat, lng, color, size }
    })
  }, [center])

  return (
    <div className="w-full h-[340px] rounded overflow-hidden">
      <Map
        defaultCenter={[center.lat, center.lng]}
        center={[center.lat, center.lng]}
        defaultZoom={13}
        zoom={13}
        provider={osm}
        dprs={[1, 2]}
        animate={true}
        metaWheelZoom={true}
        twoFingerDrag={true}
        attribution={false}
        height={340}
      >
        <Marker
          width={36}
          anchor={[center.lat, center.lng]}
          color="#1F51FF"
        />

        {showTraffic &&
          trafficDots.map((d, i) => (
            <Overlay key={i} anchor={[d.lat, d.lng]} offset={[8, 8]}>
              <div
                style={{
                  width: d.size,
                  height: d.size,
                  borderRadius: "9999px",
                  background: d.color,
                  boxShadow: `0 0 14px ${d.color}, 0 0 28px ${d.color}`,
                  opacity: 0.9,
                }}
                aria-hidden="true"
                title="Traffic hotspot"
              />
            </Overlay>
          ))}
      </Map>
    </div>
  )
}
