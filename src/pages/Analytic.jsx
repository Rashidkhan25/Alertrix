import TopNav from "@/components/layout/top-nav"
import AnalyticsApp from "@/components/analytics/analytics-app"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0B0C10" }}>
      <TopNav />
      <AnalyticsApp />
    </div>
  )
}
