
import { Component } from "react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Optional: log to an error reporting service
    console.error("Analytics ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md p-4" style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)" }}>
          <div className="text-[#E0FFFF] font-semibold">Something went wrong loading analytics.</div>
          <div className="text-[#E0FFFF]/70 text-sm mt-1">Please try refreshing the page. If the issue persists, click "Regenerate".</div>
        </div>
      )
    }
    return this.props.children
  }
}
