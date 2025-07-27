import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Cpu, MemoryStickIcon as Memory, HardDrive, Clock } from "lucide-react"
import { Button } from "@/app/components/ui/button"

interface ServerStatusCardProps {
  server: {
    id: string | number
    name: string
    status: string
    cpu: number
    ram: number
    disk: number
    uptime: string
  }
  onDelete?: () => void
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}h ${m}m ${s}s`
}

export default function ServerStatusCard({ server, onDelete }: ServerStatusCardProps) {
  // 🟢 🟡 🔴 Background for status
  const cardBackground =
    server.status === "offline"
      ? "border-red-200 bg-red-50/30"
      : server.status === "unreachable"
      ? "border-yellow-200 bg-yellow-50/30"
      : ""

  // Badge color and label
  const badgeClass =
    server.status === "online"
      ? "bg-green-600"
      : server.status === "unreachable"
      ? "bg-yellow-500 text-black"
      : ""

  const badgeLabel =
    server.status === "online"
      ? "Online"
      : server.status === "unreachable"
      ? "Unreachable"
      : "Offline"

  return (
    <Card className={cardBackground}>
      <CardHeader className="flex justify-between items-center pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>{server.name}</CardTitle>
          <Badge
            variant={server.status === "online" ? "default" : "destructive"}
            className={badgeClass}
          >
            {badgeLabel}
          </Badge>
        </div>
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            aria-label={`Delete ${server.name}`}
            onClick={onDelete}
          >
            🗑️
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {server.status === "online" ? (
          <>
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span>CPU</span>
                </div>
                <span className={server.cpu > 90 ? "text-red-600 font-medium" : ""}>{server.cpu}%</span>
              </div>
              <Progress
                value={server.cpu}
                className="h-2"
                barClassName={server.cpu > 90 ? "bg-red-600" : undefined}
              />
            </div>

            {/* RAM */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Memory className="h-4 w-4 text-muted-foreground" />
                  <span>RAM</span>
                </div>
                <span className={server.ram > 90 ? "text-red-600 font-medium" : ""}>{server.ram}%</span>
              </div>
              <Progress
                value={server.ram}
                className="h-2"
                barClassName={server.ram > 90 ? "bg-red-600" : undefined}
              />
            </div>

            {/* Disk */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>Disk</span>
                </div>
                <span className={server.disk > 90 ? "text-red-600 font-medium" : ""}>{server.disk}%</span>
              </div>
              <Progress
                value={server.disk}
                className="h-2"
                barClassName={server.disk > 90 ? "bg-red-600" : undefined}
              />
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            {server.status === "offline"
              ? "Server is currently offline"
              : "Server is currently unreachable"}
          </div>
        )}
      </CardContent>
      {server.status === "online" && (
        <CardFooter className="pt-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>Uptime: {formatUptime(Number(server.uptime))}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
