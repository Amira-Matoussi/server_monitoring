"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { File, MoreVertical, Trash, Download, Eye, ArrowUpDown, RefreshCw } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"

type ServerFile = {
  id: string
  name: string
  path: string
  size: number // in GB
  lastModified: Date
  type: string
  riskScore: number
}

type Server = {
  id: string
  name: string
  status: "Online" | "Offline"
  totalStorage: number
  usedStorage: number
  largeFiles: number
  unusedFiles: number
  deletableFiles: number
  files: ServerFile[]
}

interface ServerFileDetailsProps {
  server: Server
}

export function ServerFileDetails({ server }: ServerFileDetailsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof ServerFile>("size")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // formatSize expects bytes input
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const handleSort = (field: keyof ServerFile) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredFiles = server.files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0

    if (sortField === "size" || sortField === "riskScore") {
      comparison = a[sortField] - b[sortField]
    } else if (sortField === "lastModified") {
      comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
    } else {
      comparison = String(a[sortField]).localeCompare(String(b[sortField]))
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  return (
    <div className="border-t p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Files on {server.name}</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs h-8"
          />
          <Button size="sm" variant="outline" className="h-8 flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Analyze</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                Type <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("size")}>
                Size <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("lastModified")}>
                Last Modified <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("riskScore")}>
                Risk Score <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No files found
                </TableCell>
              </TableRow>
            ) : (
              sortedFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <File className="mr-2 h-5 w-5 text-gray-500" />
                      <div>
                        <div>{file.name}</div>
                        <div className="text-xs text-gray-500">{file.path}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{file.type}</TableCell>
                  {/* Convert GB to bytes for correct size formatting */}
                  <TableCell>{formatSize(file.size * 1024 ** 3)}</TableCell>
                  <TableCell>{file.lastModified.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        file.riskScore > 80
                          ? "bg-red-500"
                          : file.riskScore > 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }
                    >
                      {Math.trunc(file.riskScore)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {server.files.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {sortedFiles.length} of {server.files.length} files
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button size="sm" variant="destructive" className="flex items-center gap-1">
              <Trash className="h-4 w-4" />
              <span>Delete Selected</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
