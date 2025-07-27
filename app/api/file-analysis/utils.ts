import { supabase } from '@/lib/supabaseClient';

export async function getTotalStorageAndUsed() {
  const { data, error } = await supabase
    .from('server_metrics')
    .select('server_id, total_disk, disk, recorded_at')
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Error fetching metrics:', error);
    return { total: 0, used: 0 };
  }

  const latestPerServer = new Map();

  for (const row of data || []) {
    if (!latestPerServer.has(row.server_id)) {
      latestPerServer.set(row.server_id, {
        total_disk: row.total_disk ?? 0,
        disk_percent: row.disk ?? 0,
      });
    }
  }

  let total = 0;
  let used = 0;

  for (const { total_disk, disk_percent } of latestPerServer.values()) {
    total += total_disk;
    used += (disk_percent / 100) * total_disk;
  }

  return { total, used };
}

export async function getUnusedFileSize() {
  const { data, error } = await supabase
    .from("files")
    .select("size_gb, last_accessed");

  if (error) {
    console.error("Error fetching unused files:", error.message);
    return 0;
  }

  const now = new Date();

  const unusedFiles = (data ?? []).filter(file => {
    if (!file.last_accessed) return false;
    const lastAccessed = new Date(file.last_accessed);
    const daysSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceAccess >= 180;
  });

  const totalUnused = unusedFiles.reduce((sum, file) => sum + file.size_gb, 0);

  return totalUnused / 1024; // return value in TB
}

export async function getServersWithFiles() {
  const { data, error } = await supabase
    .from('servers')
    .select(`
      id,
      name,
      status,
      total_disk,
      disk,
      deletable_files,
      file_overview: file_overview ( 
        path, 
        type, 
        size, 
        last_modified, 
        risk_score 
      )
    `)

  if (error) {
    console.error('Error fetching servers + files:', error)
    return []
  }

  // Rename the nested view field to .files
  return data.map((s: any) => ({
    id:             s.id,
    name:           s.name,
    status:         s.status,
    total_disk:     s.total_disk,
    disk:           s.disk,
    deletable_files:s.deletable_files,
    files:          s.file_overview  // this is your array of {path,type,size,…}
  }))
}