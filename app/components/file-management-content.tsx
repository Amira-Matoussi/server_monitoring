"use client"
import { FileStorageOverview } from "./file-management/file-storage-overview"
import { FileServerList } from "./file-management/file-server-list"
import { AIRecommendations } from "./file-management/ai-recommendations"
import { Button } from "@/app/components/ui/button"
import { Plus, FileSearch, HardDrive } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

export default function FileManagementContent() {
  return (
    <div>
      {/* Title with icon */}
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="h-5 w-5" />
        <h2 className="text-xl font-semibold">File Management</h2>
      </div>

      {/* Storage Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <FileStorageOverview />
      </div>

      <Tabs defaultValue="servers">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="ai">AI Recommendations</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <FileSearch className="h-4 w-4" />
              <span>Analyze Storage</span>
            </Button>
            
          </div>
        </div>

        <TabsContent value="servers" className="mt-0">
          <FileServerList />
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <AIRecommendations />
        </TabsContent>
      </Tabs>
    </div>
  )
}
