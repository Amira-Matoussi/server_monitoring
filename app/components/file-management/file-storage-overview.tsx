"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { getTotalStorageAndUsed , getServersWithFiles } from "@/app/api/file-analysis/utils"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function FileStorageOverview() {
  const [totalDisk, setTotalDisk] = useState<number | null>(null)
  const [usedDisk, setUsedDisk] = useState<number | null>(null)
  const [unusedTb, setUnusedTb] = useState<number>(0)

  useEffect(() => {
    // Fetch total and used
    getTotalStorageAndUsed().then(({ total, used }) => {
      setTotalDisk(total)
      setUsedDisk(used)
    })

    // Fetch unused size from Supabase directly
    const getUnusedSize = async () => {
      const { data, error } = await supabase
        .from("files")
        .select("size_gb, last_accessed")

      if (error) {
        console.error("Error fetching unused files:", error.message)
        return
      }

      const now = new Date()
      const unused = (data ?? [])
        .filter(file => {
          if (!file.last_accessed) return false
          const accessed = new Date(file.last_accessed)
          const days = (now.getTime() - accessed.getTime()) / (1000 * 60 * 60 * 24)
          return days >= 180
        })
        .reduce((sum, f) => sum + f.size_gb, 0)

      setUnusedTb(unused / 1024) // Convert GB → TB
    }

    getUnusedSize()
  }, [])

  const usedPercent =
    totalDisk && usedDisk ? ((usedDisk / totalDisk) * 100).toFixed(0) : "0"

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="font-medium mb-2">Total Storage</div>
          <div className="text-2xl font-bold">
            {totalDisk !== null ? `${(totalDisk / 1024).toFixed(1)} TB` : "Loading..."}
          </div>
          <div className="text-sm text-gray-500 mb-2">
            {usedDisk !== null
              ? `${(usedDisk / 1024).toFixed(1)} TB used (${usedPercent}%)`
              : "Loading..."}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${usedPercent}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <Card>
  <CardContent className="p-4">
    <div className="font-medium mb-2">Unused Files</div>
    <div className="text-2xl font-bold">
      {unusedTb >= 0.01 ? `${unusedTb.toFixed(2)} TB` : "< 0.01 TB"}
    </div>
    <div className="text-sm text-gray-500 mb-2">Not accessed in 180+ days</div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-yellow-500 h-2.5 rounded-full"
        style={{
          width:
            totalDisk && unusedTb
              ? `${Math.max((unusedTb / (totalDisk / 1024)) * 100, 0.5)}%` // set a min width of 0.5%
              : "0%",
        }}
      ></div>
    </div>
  </CardContent>
</Card>


      <Card>
        <CardContent className="p-4">
          <div className="font-medium mb-2">Deletable Files</div>
          <div className="text-2xl font-bold">0 GB</div>
          <div className="text-sm text-gray-500 mb-2">AI recommended</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: "0%" }}></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="font-medium mb-2">Potential Savings</div>
          <div className="text-2xl font-bold">0%</div>
          <div className="text-sm text-gray-500 mb-2">0 TB recoverable</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "0%" }}></div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
