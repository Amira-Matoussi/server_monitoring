"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { ServerFileDetails } from "./server-file-details"
import { HardDrive, ChevronDown, ChevronUp, Database } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"

type ServerFile = {
  id: string
  name: string
  path: string
  size: number // now in GB
  lastModified: Date
  type: string
  riskScore: number
}

type Server = {
  id: string
  name: string
  status: "Online" | "Offline"
  totalStorage: number // bytes
  usedStorage: number  // bytes
  largeFiles: number
  unusedFiles: number
  deletableFiles: number
  files: ServerFile[]
}

export function FileServerList() {
  const [servers, setServers] = useState<Server[]>([])
  const [expandedServer, setExpandedServer] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const resServers = await fetch("/api/servers")
        if (!resServers.ok) throw new Error("Failed to load servers")
        const serversRaw = await resServers.json()

        const resFiles = await fetch("/api/file-analysis")
        if (!resFiles.ok) throw new Error("Failed to load file analysis data")
        const filesRaw = await resFiles.json()

        const groupedByServer = filesRaw.reduce(
          (acc: { [key: string]: any[] }, file: any) => {
            const key = file.server_id ?? "unknown"
            if (!acc[key]) acc[key] = []
            acc[key].push(file)
            return acc
          },
          {}
        )

        const MB500 = 500 * 1024 ** 2
        const DAY180 = 180 * 24 * 60 * 60 * 1000
        const now = Date.now()

        const parsed: Server[] = serversRaw.map((srv: any) => {
          const serverId = String(srv.id)
          const filesGroup = groupedByServer[serverId] || []

          const files: ServerFile[] = filesGroup.map((f: any) => ({
            id: String(f.server_id) + f.path,
            name: f.path.split(/[/\\]/).pop() || f.path,
            path: f.path,
            size: Number(f.size), // size is already in GB
            type: f.type,
            riskScore: Number(f.risk_score ?? f.riskScore ?? 0),
            lastModified: f.last_modified ? new Date(f.last_modified) : new Date(0),
          }))

          const totalStorage = srv.total_disk
            ? Number(srv.total_disk) * 1024 ** 3
            : 0

          const usedStorage = srv.disk
            ? (Number(srv.disk) / 100) * totalStorage
            : 0

          return {
            id: serverId,
            name: srv.name || `Server ${serverId}`,
            status:
              typeof srv.status === "string" &&
              srv.status.toLowerCase() === "online"
                ? "Online"
                : "Offline",
            totalStorage,
            usedStorage,
            largeFiles: files.filter((f) => f.size * 1024 ** 3 > MB500).length, // convert GB to bytes for comparison
            unusedFiles: files.filter(
              (f) => now - f.lastModified.getTime() > DAY180
            ).length,
            deletableFiles: srv.deletable_files ?? 0,
            files,
          }
        })

        parsed.sort((a, b) =>
          a.status === "Online" && b.status !== "Online"
            ? -1
            : a.status !== "Online" && b.status === "Online"
            ? 1
            : 0
        )

        setServers(parsed)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  // Format bytes (for totalStorage and usedStorage)
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(2) + " KB"
    if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(2) + " MB"
    return (bytes / 1024 ** 3).toFixed(2) + " GB"
  }

 

  const toggleServer = (id: string) =>
    setExpandedServer((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-4 w-4" />
        <h3 className="font-medium">Server Storage</h3>
      </div>

      {servers.map((server) => {
        const isExpanded = expandedServer === server.id
        return (
          <Card
            key={server.id}
            className={server.status === "Offline" ? "border-gray-300" : ""}
          >
            <CardContent className="p-0">
              {/* header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleServer(server.id)}
              >
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {server.name}
                      <Badge
                        className={
                          server.status === "Online"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }
                      >
                        {server.status}
                      </Badge>
                    </div>
                    {server.status === "Online" && (
                      <div className="text-sm text-gray-500">
                        {formatSize(server.usedStorage)} of{" "}
                        {formatSize(server.totalStorage)} used
                      </div>
                    )}
                  </div>
                </div>

                {/* stats + chevron */}
                {server.status === "Online" ? (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {server.largeFiles}
                      </div>
                      <div className="text-xs text-gray-500">Large Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {server.unusedFiles}
                      </div>
                      <div className="text-xs text-gray-500">Unused</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-600">
                        {server.deletableFiles}
                      </div>
                      <div className="text-xs text-gray-500">Deletable</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">Server is currently offline</div>
                )}
              </div>

              {/* usage bar */}
              {server.status === "Online" && (
                <div className="px-4 pb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        server.usedStorage / server.totalStorage > 0.9
                          ? "bg-red-500"
                          : server.usedStorage / server.totalStorage > 0.7
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${
                          (server.usedStorage / server.totalStorage) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* file details */}
              {isExpanded && server.status === "Online" && (
                <ServerFileDetails server={server} />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
