"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Trash, RefreshCw, Check, X, AlertTriangle, Clock, FileText } from "lucide-react"

type Recommendation = {
  id: string
  type: "duplicate" | "unused" | "large" | "temp"
  description: string
  impact: string
  files: {
    name: string
    path: string
    server: string
    size: number
  }[]
}

export function CleanupRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "1",
      type: "duplicate",
      description: "Duplicate log files",
      impact: "Save 120 MB",
      files: [
        {
          name: "server.log",
          path: "/var/logs/server.log",
          server: "Server-01",
          size: 1024 * 1024 * 120,
        },
        {
          name: "server.log.1",
          path: "/var/logs/server.log.1",
          server: "Server-01",
          size: 1024 * 1024 * 115,
        },
      ],
    },
    {
      id: "2",
      type: "unused",
      description: "Old backup files",
      impact: "Save 350 MB",
      files: [
        {
          name: "backup-2022.tar.gz",
          path: "/backups/backup-2022.tar.gz",
          server: "Server-05",
          size: 1024 * 1024 * 350,
        },
      ],
    },
    {
      id: "3",
      type: "temp",
      description: "Temporary cache files",
      impact: "Save 512 MB",
      files: [
        {
          name: "cache.dat",
          path: "/tmp/cache.dat",
          server: "Server-03",
          size: 1024 * 1024 * 350,
        },
        {
          name: "temp.dat",
          path: "/tmp/temp.dat",
          server: "Server-03",
          size: 1024 * 1024 * 162,
        },
      ],
    },
  ])

  const [loading, setLoading] = useState(false)

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const getRecommendationIcon = (type: Recommendation["type"]) => {
    switch (type) {
      case "duplicate":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "unused":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "large":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "temp":
        return <Trash className="h-5 w-5 text-red-500" />
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    // Simulate API call to get new recommendations
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  const handleApply = (id: string) => {
    // Remove the recommendation from the list
    setRecommendations(recommendations.filter((rec) => rec.id !== id))
    // In a real app, you would call an API to delete the files
  }

  const handleDismiss = (id: string) => {
    // Remove the recommendation from the list
    setRecommendations(recommendations.filter((rec) => rec.id !== id))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>AI Recommendations</CardTitle>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">AI-powered suggestions to optimize storage usage</p>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recommendations at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <h3 className="font-medium">{rec.description}</h3>
                    <p className="text-sm text-green-600 font-medium">{rec.impact}</p>
                    <div className="mt-2 space-y-1">
                      {rec.files.map((file, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          {file.name}{" "}
                          <span className="text-gray-400">
                            ({file.server}: {formatSize(file.size)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleApply(rec.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(rec.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
