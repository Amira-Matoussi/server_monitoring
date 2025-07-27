"use client"

import { useState } from "react"

type FileItem = {
  id: string
  name: string
  type: "file" | "folder"
  size: number
  lastModified: Date
  path: string
  server: string
  riskScore?: number
}

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
  category?: string
  potentialSavings?: number
  automationPossible?: boolean
}

export function useFileAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const analyzeFiles = async (files: FileItem[]) => {
    setIsAnalyzing(true)
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/file-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze files")
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsAnalyzing(false)
      setIsLoading(false)
    }
  }

  return {
    analyzeFiles,
    isAnalyzing,
    recommendations,
    error,
    isLoading,
  }
}
