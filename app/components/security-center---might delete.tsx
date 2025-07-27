"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { AlertTriangle, Shield, ShieldCheck, ShieldAlert, AlertCircle, Clock, ArrowUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

// Mock security threats data
const securityThreats: Array<{
  id: string
  title: string
  description: string
  severity: "high" | "medium" | "low"
  timestamp: string
  status: "active" | "investigating" | "resolved"
  server: string
}> = [
  {
    id: "threat-1",
    title: "Suspicious Login Attempt",
    description: "Multiple failed login attempts from IP 192.168.1.45",
    severity: "high",
    timestamp: "2025-04-05T08:23:15Z",
    status: "active",
    server: "Server-02",
  },
  {
    id: "threat-2",
    title: "Port Scan Detected",
    description: "Port scanning activity detected from IP 203.0.113.42",
    severity: "medium",
    timestamp: "2025-04-05T07:45:30Z",
    status: "active",
    server: "Server-01",
  },
  {
    id: "threat-3",
    title: "Unusual Disk Usage",
    description: "Spike in outbound traffic to unknown IP addresses",
    severity: "medium",
    timestamp: "2025-04-05T06:12:08Z",
    status: "investigating",
    server: "Server-03",
  },
  {
    id: "threat-4",
    title: "Malware Signature Detected",
    description: "Potential malware signature found in uploaded file",
    severity: "high",
    timestamp: "2025-04-04T22:37:45Z",
    status: "resolved",
    server: "Server-05",
  },
  {
    id: "threat-5",
    title: "Unauthorized Access Attempt",
    description: "Attempt to access restricted directory",
    severity: "high",
    timestamp: "2025-04-04T19:14:22Z",
    status: "resolved",
    server: "Server-01",
  },
  {
    id: "threat-6",
    title: "SSL Certificate Expiring",
    description: "SSL Certificate will expire in 5 days",
    severity: "low",
    timestamp: "2025-04-05T09:00:00Z",
    status: "active",
    server: "Server-02",
  },
]

export default function SecurityCenter() {
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState("desc")

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  // Filter and sort threats
  const filteredThreats = securityThreats
    .filter((threat) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      if (filter === "all") return true
      if (filter === "active") return threat.status === "active"
      if (filter === "investigating") return threat.status === "investigating"
      if (filter === "resolved") return threat.status === "resolved"
      if (filter === "high") return threat.severity === "high"
      if (filter === "medium") return threat.severity === "medium"
      return true
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === "severity") {
        const severityOrder = { high: 3, medium: 2, low: 1 }
        comparison = severityOrder[a.severity] - severityOrder[b.severity]
      } else if (sortBy === "timestamp") {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortBy === "server") {
        comparison = a.server.localeCompare(b.server)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Count threats by severity
  const highCount = securityThreats.filter((t) => t.severity === "high" && t.status !== "resolved").length
  const mediumCount = securityThreats.filter((t) => t.severity === "medium" && t.status !== "resolved").length
  const lowCount = securityThreats.filter((t) => t.severity === "low" && t.status !== "resolved").length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={highCount > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Severity Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {highCount}
              {highCount > 0 && <AlertTriangle className="ml-2 h-5 w-5 text-red-600" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {highCount > 0 ? "Immediate attention required" : "No high severity threats"}
            </p>
          </CardContent>
        </Card>

        <Card className={mediumCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium Severity Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {mediumCount}
              {mediumCount > 0 && <AlertCircle className="ml-2 h-5 w-5 text-amber-600" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {mediumCount > 0 ? "Investigation recommended" : "No medium severity threats"}
            </p>
          </CardContent>
        </Card>

        <Card className={lowCount > 0 ? "border-blue-200 bg-blue-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Severity Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {lowCount}
              {lowCount > 0 && <Shield className="ml-2 h-5 w-5 text-blue-600" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lowCount > 0 ? "Monitor and review" : "No low severity threats"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Security Insights</CardTitle>
          <CardDescription>Predictive security analysis powered by machine learning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
            <h3 className="font-medium mb-2 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
              Threat Prediction
            </h3>
            <p className="text-sm text-slate-700">
              Based on current traffic patterns and historical data, there's a 78% chance of increased brute force
              attempts in the next 24 hours. Consider implementing additional authentication safeguards.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
            <h3 className="font-medium mb-2 flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-amber-600" />
              Vulnerability Assessment
            </h3>
            <p className="text-sm text-slate-700">
              AI analysis has identified 3 potential vulnerabilities in your network configuration. Review the security
              recommendations for Server-01 and Server-03.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline">View Full AI Security Report</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Security Threats</h2>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="server">Server</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={toggleSortOrder}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle sort order"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Threats</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="investigating">Investigating</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="high">High Severity</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            <div className="space-y-4">
              {filteredThreats.length > 0 ? (
                filteredThreats.map((threat) => (
                  <Card
                    key={threat.id}
                    className={
                      threat.severity === "high"
                        ? "border-red-200"
                        : threat.severity === "medium"
                          ? "border-amber-200"
                          : "border-blue-200"
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{threat.title}</CardTitle>
                          <CardDescription>{threat.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              threat.status === "active"
                                ? "destructive"
                                : threat.status === "investigating"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {threat.status}
                          </Badge>
                          <Badge
                            variant={
                              threat.severity === "high"
                                ? "destructive"
                                : threat.severity === "medium"
                                  ? "default"
                                  : "outline"
                            }
                            className={threat.severity === "medium" ? "bg-amber-600" : ""}
                          >
                            {threat.severity}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{new Date(threat.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{threat.server}</div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No threats found matching the current filter
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
