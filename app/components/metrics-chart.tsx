"use client"

import { useState } from "react"

import { useEffect, useRef } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

// Mock data for the chart
const generateMockData = (days = 7, metric = "cpu") => {
  const data = []
  const now = new Date()

  for (let i = 0; i < days * 24; i++) {
    const time = new Date(now.getTime() - (days * 24 - i) * 60 * 60 * 1000)

    let value
    if (metric === "cpu") {
      value = 20 + Math.random() * 40
      // Add some spikes
      if (i % 12 === 0) value = 70 + Math.random() * 25
    } else if (metric === "ram") {
      value = 30 + Math.random() * 30
      // More stable with occasional jumps
      if (i % 24 === 0) value = 60 + Math.random() * 20
    } else {
      value = 10 + Math.random() * 60
      // Very spiky
      if (i % 8 === 0) value = 50 + Math.random() * 40
    }

    data.push({
      time: time.toISOString(),
      value: Math.round(value),
    })
  }

  return data
}

export default function MetricsChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeMetric, setActiveMetric] = useState("cpu")

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get data based on active metric
    const data = generateMockData(7, activeMetric)

    // Set up chart dimensions
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#e2e8f0"
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#64748b"
    ctx.font = "12px Inter, sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    for (let i = 0; i <= 100; i += 20) {
      const y = canvas.height - padding - (i / 100) * chartHeight
      ctx.fillText(`${i}%`, padding - 10, y)

      // Draw horizontal grid lines
      ctx.beginPath()
      ctx.strokeStyle = "#e2e8f0"
      ctx.setLineDash([5, 5])
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw x-axis labels (days)
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const today = new Date().getDay()

    for (let i = 0; i < 7; i++) {
      const dayIndex = (today - 6 + i + 7) % 7
      const x = padding + (i / 6) * chartWidth
      ctx.fillText(days[dayIndex], x, canvas.height - padding + 10)
    }

    // Draw data line
    ctx.beginPath()
    ctx.strokeStyle = getMetricColor(activeMetric)
    ctx.lineWidth = 2

    // Fill area under the line
    const fillGradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding)
    fillGradient.addColorStop(0, `${getMetricColor(activeMetric)}33`)
    fillGradient.addColorStop(1, `${getMetricColor(activeMetric)}05`)

    data.forEach((point, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth
      const y = canvas.height - padding - (point.value / 100) * chartHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    // Draw the stroke
    ctx.stroke()

    // Fill area under the line
    ctx.lineTo(padding + chartWidth, canvas.height - padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.closePath()
    ctx.fillStyle = fillGradient
    ctx.fill()

    // Draw data points
    data
      .filter((_, i) => i % 12 === 0)
      .forEach((point, i) => {
        const x = padding + ((i * 12) / (data.length - 1)) * chartWidth
        const y = canvas.height - padding - (point.value / 100) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = "white"
        ctx.fill()
        ctx.strokeStyle = getMetricColor(activeMetric)
        ctx.lineWidth = 2
        ctx.stroke()
      })
  }, [activeMetric])

  // Helper function to get color based on metric
  function getMetricColor(metric: string) {
    switch (metric) {
      case "cpu":
        return "#3b82f6"
      case "ram":
        return "#10b981"
      case "disk":
        return "#8b5cf6"
      default:
        return "#3b82f6"
    }
  }

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          canvasRef.current.width = container.clientWidth
          canvasRef.current.height = container.clientHeight

          // Redraw chart
          const event = new Event("resize")
          window.dispatchEvent(event)
        }
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="cpu" className="w-full" value={activeMetric} onValueChange={setActiveMetric}>
        <TabsList className="mb-4">
          <TabsTrigger value="cpu">CPU Usage</TabsTrigger>
          <TabsTrigger value="ram">RAM Usage</TabsTrigger>
          <TabsTrigger value="disk">Disk Usage</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 w-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}
