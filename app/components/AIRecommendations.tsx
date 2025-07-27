"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"

interface Rec {
  title: string
  estimated_savings: number
  difficulty: string
  automated: boolean
  description: string
}

export default function AIRecommendations() {
  const [recs, setRecs] = useState<Rec[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string| null>(null)

  const fetchRecs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai-recommendations")
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setTotal(data.total)
      setRecs(data.recommendations)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecs()
  }, [])

  if (loading) return <div>Loading AI recommendations…</div>
  if (error)   return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">✨ AI Recommendations</h2>
        <Button size="sm" variant="outline" onClick={fetchRecs}>
          Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Potential savings: <span className="font-medium">{total.toFixed(2)} GB</span>
      </p>

      <div className="space-y-3">
        {recs.map((r, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p>{r.description}</p>
              <div className="flex items-center gap-2">
                <span>{r.estimated_savings.toFixed(2)} GB</span>
                <Badge variant="outline">{r.difficulty}</Badge>
                {r.automated && <Badge>Automated</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
