'use client'

import React, { Suspense, useEffect, useState } from 'react'
import useSWR from 'swr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Card, CardContent } from '@/app/components/ui/card'
import { AlertCircle, Server, Shield, HardDrive } from 'lucide-react'
import DashboardContent from '@/app/components/dashboard-content'
import SecurityContent from '@/app/components/security-content'
import FileManagementContent from '@/app/components/file-management-content'
import Loading from '@/app/components/loading'
import Navbar from '@/app/components/navbar'

// Define the shape of your server metric
interface ServerMetric {
  id: number
  name: string
  cpu: number
  // Add other fields if needed
}

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// AlertBanner component: shows critical or all-clear banners
function AlertBanner({ threshold = 80 }: { threshold?: number }) {
  const { data, error } = useSWR<ServerMetric[]>('/api/servers', fetcher)
  const [critical, setCritical] = useState<ServerMetric[]>([])

  useEffect(() => {
    if (data) {
      // collect all servers with cpu > threshold
      setCritical(data.filter((srv) => srv.cpu > threshold))
    }
  }, [data, threshold])

  // Show nothing until data or error
  if (!data && !error) return null

  return (
    <div className="mb-4">
      {error ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-yellow-800">
            Error loading metrics: {error.message}
          </CardContent>
        </Card>
      ) : critical.length ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <AlertCircle className="h-5 w-5" />
              <span>Critical CPU usage on:</span>
            </div>
            <ul className="mt-2 list-disc list-inside text-red-700">
              {critical.map((srv) => (
                <li key={srv.id}>
                  {srv.name} — {Math.round(srv.cpu)}%
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-2 text-green-600">
            <span className="text-xl">✅</span>
            <span>All clear — no critical CPU usage detected</span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 p-4 md:p-6">
        {/* Dynamic Alert Banner: shows red if critical, green if all clear */}
        <AlertBanner threshold={80} />

        <Tabs defaultValue="dashboard" className="flex-1">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="file-management" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 flex-1">
            <Suspense fallback={<Loading />}>
              <DashboardContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="security" className="mt-0 flex-1">
            <Suspense fallback={<Loading />}>
              <SecurityContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="file-management" className="mt-0 flex-1">
            <Suspense fallback={<Loading />}>
              <FileManagementContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
