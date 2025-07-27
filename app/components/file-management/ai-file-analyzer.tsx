"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Loader2, FileSearch, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"

type AnalysisResult = {
  category: string
  count: number
  size: number
  risk: "low" | "medium" | "high"
}

export function AIFileAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [summary, setSummary] = useState<string | null>(null)

  const startAnalysis = () => {
    setIsAnalyzing(true)
    setProgress(0)
    setResults([])
    setSummary(null)

    // Simulate AI analysis with progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsAnalyzing(false)
            // Mock results that would come from the AI
            setResults([
              { category: "Duplicate files", count: 47, size: 1024 * 1024 * 1024 * 0.85, risk: "high" },
              { category: "Unused log files", count: 128, size: 1024 * 1024 * 1024 * 1.2, risk: "medium" },
              { category: "Temporary files", count: 215, size: 1024 * 1024 * 1024 * 0.65, risk: "high" },
              { category: "Old backups", count: 12, size: 1024 * 1024 * 1024 * 3.4, risk: "low" },
              { category: "Cache files", count: 89, size: 1024 * 1024 * 1024 * 0.95, risk: "medium" },
            ])
            setSummary(
              "AI analysis identified 7.05 TB of storage that could potentially be reclaimed, with 1.5 TB being safe to delete immediately.",
            )
          }, 500)
          return 100
        }
        return newProgress
      })
    }, 300)
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          AI File Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isAnalyzing && results.length === 0 && (
          <div className="text-center py-6">
            <FileSearch className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-muted-foreground mb-6">
              Use AI to analyze your files across all servers and identify optimization opportunities
            </p>
            <Button onClick={startAnalysis}>Start AI Analysis</Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Analyzing files across servers...</p>
                <p className="text-sm text-muted-foreground">This may take a few minutes</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-right text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>
        )}

        {!isAnalyzing && results.length > 0 && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{summary}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis Results
              </h3>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(result.risk)}>
                        {result.risk === "high" ? (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        ) : result.risk === "low" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : null}
                        {result.risk}
                      </Badge>
                      <span>{result.category}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{result.count}</span> files,{" "}
                      <span className="font-medium">{formatSize(result.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={startAnalysis}>
                Refresh Analysis
              </Button>
              <Button>Generate Cleanup Plan</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
