"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"
import { AlertCircle } from "lucide-react"

interface AddServerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddServer: (server: {
    id: number
    name: string
    ip_address: string
    mac_address: string
    status: string
    cpu: number
    ram: number
    disk: number
    uptime: string
    created_at: string
  }) => void
}

export default function AddServerModal({ open, onOpenChange, onAddServer }: AddServerModalProps) {
  const [name, setName] = useState("")
  const [ipAddress, setIpAddress] = useState("")
  const [macAddress, setMacAddress] = useState("")
  const [status, setStatus] = useState("online")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate required fields
    if (!name || !ipAddress || !macAddress) {
      setError("All fields are required.")
      return
    }

    // Validate IP format
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
    if (!ipRegex.test(ipAddress)) {
      setError("Invalid IP address format.")
      return
    }

    // Relaxed MAC validation
    if (macAddress.trim().length < 5) {
      setError("MAC address seems too short.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ip_address: ipAddress,
          mac_address: macAddress,
          status,
        }),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Failed to add server")
      }

      const newServer = await res.json()
      onAddServer(newServer)

      // Reset form
      setName("")
      setIpAddress("")
      setMacAddress("")
      setStatus("online")
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to add server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Server</DialogTitle>
            <DialogDescription>Enter all server details below.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., server-01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 192.168.1.100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
