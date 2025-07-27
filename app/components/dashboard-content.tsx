"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import AddServerModal from "./add-server-modal";
import { Button } from "@/app/components/ui/button";
import ServerStatusCard from "./server-status-card";

interface Server {
  id: number | string;
  name: string;
  status: string;
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  recorded_at?: string;
}

export default function DashboardContent() {
  const [sortBy, setSortBy] = useState<keyof Server>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [serverList, setServerList] = useState<Server[]>([]);
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<Server | null>(null);

  const fetchServers = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/servers");
      if (!res.ok) throw new Error("Failed to fetch servers");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid response format");
      const mapped: Server[] = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cpu: s.cpu,
        ram: s.ram,
        disk: s.disk,
        uptime: s.uptime,
        recorded_at: s.recorded_at,
      }));
      setServerList(mapped);
    } catch (err) {
      console.error("❌ fetchServers failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteServer = async (serverId: number | string) => {
    try {
      const res = await fetch("/api/servers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serverId }),
      });
      if (!res.ok) throw new Error("Failed to delete server");
      setServerList((prev) => prev.filter((server) => server.id !== serverId));
      setDeleteModalOpen(false);
      setServerToDelete(null);
    } catch (err) {
      console.error("❌ deleteServer failed:", err);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedServers = [...serverList].sort((a, b) => {
    let comparison = 0;
    if (["name", "status", "uptime"].includes(sortBy)) {
      comparison = String(a[sortBy]).localeCompare(String(b[sortBy]));
    } else {
      comparison = (a[sortBy] as number) - (b[sortBy] as number);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // ✅ Corrected counts
  const onlineCount = serverList.filter((s) => s.status === "online").length;
  const offlineCount = serverList.filter((s) => s.status === "offline").length;
  const unreachableCount = serverList.filter((s) => s.status === "unreachable").length;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverList.length}</div>
            <div className="flex mt-2 gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {onlineCount} Online
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {offlineCount} Offline
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                {unreachableCount} Unreachable
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineCount
                ? (serverList
                    .filter((s) => s.status === "online")
                    .reduce((acc, s) => acc + s.cpu, 0) / onlineCount
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <Progress
              value={
                onlineCount
                  ? serverList
                      .filter((s) => s.status === "online")
                      .reduce((acc, s) => acc + s.cpu, 0) / onlineCount
                  : 0
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average RAM Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineCount
                ? (serverList
                    .filter((s) => s.status === "online")
                    .reduce((acc, s) => acc + s.ram, 0) / onlineCount
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <Progress
              value={
                onlineCount
                  ? serverList
                      .filter((s) => s.status === "online")
                      .reduce((acc, s) => acc + s.ram, 0) / onlineCount
                  : 0
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineCount
                ? (serverList
                    .filter((s) => s.status === "online")
                    .reduce((acc, s) => acc + s.disk, 0) / onlineCount
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <Progress
              value={
                onlineCount
                  ? serverList
                      .filter((s) => s.status === "online")
                      .reduce((acc, s) => acc + s.disk, 0) / onlineCount
                  : 0
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Server Status Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Server Status</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchServers} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing…" : "Refresh Metrics"}
            </Button>
            <Button variant="outline" onClick={() => setIsAddServerModalOpen(true)}>
              Add Server
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (serverList.length > 0) {
                  setServerToDelete(serverList[0]);
                  setDeleteModalOpen(true);
                }
              }}
              disabled={serverList.length === 0}
              className="text-red-600 hover:text-red-700"
            >
              Delete Server
            </Button>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as keyof Server)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="cpu">CPU Usage</SelectItem>
                <SelectItem value="ram">RAM Usage</SelectItem>
                <SelectItem value="disk">Disk Usage</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedServers.map((server) => (
            <ServerStatusCard key={server.id} server={server} />
          ))}
        </div>
      </div>

      <AddServerModal
        open={isAddServerModalOpen}
        onOpenChange={setIsAddServerModalOpen}
        onAddServer={(dbRec) => {
          const newServer: Server = {
            id: dbRec.id,
            name: dbRec.name,
            status: dbRec.status,
            cpu: dbRec.cpu,
            ram: dbRec.ram,
            disk: dbRec.disk,
            uptime: dbRec.uptime,
          };
          setServerList((prev) => [newServer, ...prev]);
        }}
      />

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Server</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select server to delete:</label>
              <select
                className="w-full p-2 border rounded-md"
                value={serverToDelete?.name || ""}
                onChange={(e) => {
                  const srv = serverList.find((s) => s.name === e.target.value) || null;
                  setServerToDelete(srv);
                }}
              >
                <option value="">Select a server...</option>
                {serverList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{serverToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setServerToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!serverToDelete}
                onClick={() => {
                  if (!serverToDelete) return;
                  const confirm = window.confirm(
                    `Are you sure you want to delete "${serverToDelete.id}"? This action is irreversible.`
                  );
                  if (confirm) deleteServer(serverToDelete.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
