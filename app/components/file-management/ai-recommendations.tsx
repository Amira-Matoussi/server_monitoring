"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Sparkles, Trash, Archive, FileArchive, FileX, FileCog, CheckCircle2, BarChart4 } from "lucide-react"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

type RecommendationType = "delete" | "compress" | "archive" | "relocate"

type Recommendation = {
  id: string
  type: RecommendationType
  title: string
  description: string
  impact: string
  savings: number
  complexity: "easy" | "medium" | "complex"
  automated: boolean
}

export function AIRecommendations() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "rec1",
      type: "delete",
      title: "Remove temporary files",
      description: "Delete 215 temporary files across all servers that haven't been accessed in over 90 days",
      impact: "Low risk - these files are safe to delete",
      savings: 1024 * 1024 * 1024 * 0.65,
      complexity: "easy",
      automated: true,
    },
    {
      id: "rec2",
      type: "compress",
      title: "Compress log archives",
      description: "Compress 47 log archive files to reduce their size while maintaining accessibility",
      impact: "Medium risk - verify logs aren't actively used",
      savings: 1024 * 1024 * 1024 * 0.85,
      complexity: "medium",
      automated: true,
    },
    {
      id: "rec3",
      type: "archive",
      title: "Archive old backups",
      description: "Move 12 backup files older than 1 year to cold storage",
      impact: "Low risk - backups will remain accessible but at lower cost",
      savings: 1024 * 1024 * 1024 * 3.4,
      complexity: "complex",
      automated: false,
    },
    {
      id: "rec4",
      type: "relocate",
      title: "Relocate media files",
      description: "Move 28 large media files to dedicated storage server",
      impact: "Low risk - improves performance and organization",
      savings: 1024 * 1024 * 1024 * 1.2,
      complexity: "medium",
      automated: false,
    },
    {
      id: "rec5",
      type: "delete",
      title: "Remove duplicate files",
      description: "Delete 89 duplicate files identified across servers",
      impact: "Medium risk - verify duplicates before deletion",
      savings: 1024 * 1024 * 1024 * 0.95,
      complexity: "easy",
      automated: true,
    },
  ])

  const [implementing, setImplementing] = useState<Record<string, boolean>>({})
  const [implemented, setImplemented] = useState<Record<string, boolean>>({})
  const [progress, setProgress] = useState<Record<string, number>>({})

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const getTypeIcon = (type: RecommendationType) => {
    switch (type) {
      case "delete":
        return <Trash className="h-5 w-5 text-red-500" />
      case "compress":
        return <FileArchive className="h-5 w-5 text-yellow-500" />
      case "archive":
        return <Archive className="h-5 w-5 text-blue-500" />
      case "relocate":
        return <FileCog className="h-5 w-5 text-purple-500" />
      default:
        return <FileX className="h-5 w-5" />
    }
  }

  const handleImplement = (id: string) => {
    setImplementing((prev) => ({ ...prev, [id]: true }))
    setProgress((prev) => ({ ...prev, [id]: 0 }))

    // Simulate implementation progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = (prev[id] || 0) + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setImplementing((prev) => ({ ...prev, [id]: false }))
            setImplemented((prev) => ({ ...prev, [id]: true }))
          }, 500)
          return { ...prev, [id]: 100 }
        }
        return { ...prev, [id]: newProgress }
      })
    }, 300)
  }

  const filteredRecommendations = recommendations.filter((rec) => {
    if (activeTab === "all") return true
    if (activeTab === "implemented") return implemented[rec.id]
    if (activeTab === "pending") return !implemented[rec.id]
    return rec.type === activeTab
  })

  const totalSavings = filteredRecommendations.reduce((sum, rec) => sum + rec.savings, 0)
  const implementedSavings = recommendations
    .filter((rec) => implemented[rec.id])
    .reduce((sum, rec) => sum + rec.savings, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Potential savings</div>
            <div className="text-2xl font-bold">{formatSize(totalSavings)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-green-600">Implemented</div>
            <div className="text-2xl font-bold text-green-600">{formatSize(implementedSavings)}</div>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
            <TabsTrigger value="compress">Compress</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
            <TabsTrigger value="implemented">Implemented</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredRecommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart4 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No recommendations in this category</p>
              </div>
            ) : (
              filteredRecommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4">
                  <div className="flex gap-3">
                    {getTypeIcon(rec.type)}
                    <div className="flex-1">
                      <h3 className="font-medium">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-green-600">Save {formatSize(rec.savings)}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{rec.complexity}</span>
                        {rec.automated && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Automated</span>
                        )}
                      </div>

                      {implementing[rec.id] && (
                        <div className="mt-3">
                          <Progress value={progress[rec.id]} className="h-1.5 mb-1" />
                          <p className="text-xs text-right text-muted-foreground">
                            {Math.round(progress[rec.id])}% complete
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      {implemented[rec.id] ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle2 className="h-5 w-5 mr-1" />
                          <span className="text-sm">Implemented</span>
                        </div>
                      ) : implementing[rec.id] ? (
                        <Button disabled>Implementing...</Button>
                      ) : (
                        <Button onClick={() => handleImplement(rec.id)}>Implement</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
