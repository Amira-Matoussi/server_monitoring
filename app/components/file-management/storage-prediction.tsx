"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, Calendar, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

type PredictionData = {
  month: string
  actual: number
  predicted: number
  optimized?: number
}

export function StoragePrediction() {
  const [timeframe, setTimeframe] = useState("6months")
  const [loading, setLoading] = useState(false)

  // Generate prediction data
  const generateData = (): PredictionData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()
    const data: PredictionData[] = []

    // Past data (actual)
    for (let i = 6; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const baseStorage = 4000 + (6 - i) * 500 // Starting at 4TB, growing by 500GB per month
      const randomVariation = Math.random() * 200 - 100 // +/- 100GB random variation

      data.push({
        month: months[monthIndex],
        actual: Math.max(0, baseStorage + randomVariation),
        predicted: i === 0 ? baseStorage : 0, // Only show prediction for current month
      })
    }

    // Future predictions
    const predictionMonths = timeframe === "3months" ? 3 : timeframe === "6months" ? 6 : 12

    for (let i = 1; i <= predictionMonths; i++) {
      const monthIndex = (currentMonth + i) % 12
      const baseStorage = 4000 + (6 + i) * 500 // Continue growth trend
      const optimizedStorage = baseStorage * 0.7 // 30% savings with optimizations

      data.push({
        month: months[monthIndex],
        actual: 0, // No actual data for future
        predicted: baseStorage,
        optimized: optimizedStorage,
      })
    }

    return data
  }

  const [data, setData] = useState<PredictionData[]>(generateData())

  const refreshPredictions = () => {
    setLoading(true)
    setTimeout(() => {
      setData(generateData())
      setLoading(false)
    }, 1500)
  }

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
    setData(generateData())
  }

  const formatStorage = (value: number) => {
    return `${(value / 1000).toFixed(1)} TB`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          AI Storage Prediction
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshPredictions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatStorage} />
              <Tooltip formatter={(value) => formatStorage(value as number)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Actual Usage"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Predicted Usage"
              />
              <Line
                type="monotone"
                dataKey="optimized"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="With Optimizations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            AI Prediction Insights
          </h3>
          <p className="text-sm text-blue-800">
            Based on current growth patterns, storage usage is projected to increase by 3TB in the next 6 months.
            Implementing the recommended optimizations could save approximately 30% of storage costs and extend current
            capacity by an additional 8 months before upgrades are needed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
