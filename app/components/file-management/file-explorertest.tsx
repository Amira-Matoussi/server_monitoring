// File: app/components/file-explorer.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
  ArrowUpDown,
  File,
  Folder,
  MoreVertical,
  Trash,
  Download,
  Eye,
  HardDrive,
} from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

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

export function FileExplorer() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [sortField, setSortField] = useState<keyof FileItem>("size")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [searchTerm, setSearchTerm] = useState("")

  // 1) Fetch real data on mount
  useEffect(() => {
  async function load() {
    const res = await fetch("/api/file-analysis")   // ← …to this
    if (!res.ok) throw new Error("Failed to load files")
    const raw: any[] = await res.json()

    const items: FileItem[] = raw.map(f => ({
      id:       `${f.server_id}-${f.path}`,
      name:     f.path.split(/[/\\]/).pop() || f.path,
      path:     f.path,
      type:     f.type,
      size:     Number(f.size),
      lastModified: new Date(f.last_modified),
      server:   String(f.server_id),
      riskScore: Number(f.risk_score),
    }))

    setFiles(items)
  }
  load()
}, [])


  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const handleSort = (field: keyof FileItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filtered = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.server.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedFiles = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortField === "size" || sortField === "riskScore") {
      cmp = (a[sortField] || 0) - (b[sortField] || 0)
    } else if (sortField === "lastModified") {
      cmp = a.lastModified.getTime() - b.lastModified.getTime()
    } else {
      cmp = String(a[sortField]).localeCompare(String(b[sortField]))
    }
    return sortDirection === "asc" ? cmp : -cmp
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          File Explorer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Browse, sort, and manage files across all servers
        </p>
        <div className="mt-2">
          <Input
            placeholder="Search files, paths, or servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("server")}
                >
                  Server <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("size")}
                >
                  Size <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("lastModified")}
                >
                  Last Modified{" "}
                  <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("riskScore")}
                >
                  Risk Score{" "}
                  <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {file.type === "folder" ? (
                        <Folder className="mr-2 h-5 w-5 text-blue-500" />
                      ) : (
                        <File className="mr-2 h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <div>{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {file.path}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{file.server}</TableCell>
                  <TableCell>{formatSize(file.size)}</TableCell>
                  <TableCell>
                    {file.lastModified.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {file.riskScore != null ? (
                      <Badge
                        className={
                          file.riskScore > 80
                            ? "bg-red-500"
                            : file.riskScore > 50
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }
                      >
                        {file.riskScore}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
