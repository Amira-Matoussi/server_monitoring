"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { ShieldCheck, ShieldAlert } from "lucide-react"

export default function SecurityContent() {
  const [threats, setThreats] = useState<{ [key: string]: string[] }>({})
  const [forecast, setForecast] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchThreats() {
      try {
        const res = await fetch("/api/security")
        if (!res.ok) throw new Error("Failed to fetch threats from API")
        const data = await res.json()

        if (!data || typeof data !== "object") throw new Error("Invalid API response")

        setThreats(data.threats || {})
        setForecast(data.forecast || [])
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      }
    }

    fetchThreats()
  }, [])

  const servers = Object.keys(threats)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Security Insights</CardTitle>
          <CardDescription>Technology Friend's predictive analysis powered by machine learning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
            <h3 className="font-medium mb-2 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
              Threat Prediction
            </h3>

            {forecast.length > 0 ? (() => {
              const alertServers = forecast
                .filter((f) => f.cpu_alert || f.ram_alert)
                .map((f) => ({
                  name: f.server,
                  cpu: f.cpu_alert,
                  ram: f.ram_alert,
                }))

              if (alertServers.length === 0) {
                return (
                  <p className="text-sm text-slate-700">
                    No actions needed at this time. AI analysis has not detected any immediate threats.
                  </p>
                )
              }

              return (
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                  {alertServers.map((server, idx) => {
                    const issues = []
                    if (server.cpu) issues.push("CPU")
                    if (server.ram) issues.push("RAM")
                    return (
                      <li key={idx}>
                        <span className="font-medium">{server.name}</span>: High {issues.join(" & ")} usage forecasted
                      </li>
                    )
                  })}
                </ul>
              )
            })() : (
              <p className="text-sm text-slate-700">Loading threat predictions...</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
            <h3 className="font-medium mb-2 flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-amber-600" />
              Vulnerability Assessment
            </h3>
            <p className="text-sm text-slate-700">
              Review the vulnerabilities identified by AI for each server listed below.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Security Threats</h2>

        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Servers</TabsTrigger>
            {/* Add more tabs if needed */}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {error && (
              <div className="text-red-600 text-sm mb-4">Error loading data: {error}</div>
            )}
            <div className="space-y-4">
              {servers.length > 0 ? (
                servers.map((server) => (
                  <Card key={server}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                        <span>Threats detected on {server}</span>
                      </CardTitle>
                      <CardDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {threats[server].map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 text-sm text-muted-foreground">
                      Total Threats: {threats[server].length}
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No threat data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
