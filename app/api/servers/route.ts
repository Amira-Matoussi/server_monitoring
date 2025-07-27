import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  const { data: servers, error } = await supabase
    .from('servers')
    .select('id, name, ip_address, mac_address, status, created_at');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = await Promise.all(
    (servers || []).map(async (s: any) => {
      let cpu = null,
          ram = null,
          disk = null,
          uptime = null,
          total_disk = null,
          recorded_at = null;
      let updatedStatus = s.status;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

      try {
        const res = await fetch(`http://${s.ip_address}:8000/api/metrics`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const m = await res.json();
          cpu         = m.cpu_percent;
          ram         = m.ram_percent;
          disk        = m.disk_percent;
          uptime      = m.uptime_seconds;
          total_disk  = m.total_disk;
          recorded_at = m.timestamp;

          // 🧠 Decide status based on uptime
          if (uptime > 0) {
            updatedStatus = 'online';
          } else {
            updatedStatus = 'offline';
          }
        } else {
          console.warn(`Agent ${s.name} responded ${res.status}`);
          updatedStatus = 'unreachable';
        }
      } catch (e) {
        clearTimeout(timeout);
        console.warn(`Cannot fetch metrics for ${s.name}:`, e);
        updatedStatus = 'unreachable';
      }

      // 🔥 Update status in Supabase if changed
      if (updatedStatus !== s.status) {
        await supabase
          .from('servers')
          .update({ status: updatedStatus })
          .eq('id', s.id);
      }

      return {
        id:            s.id,
        name:          s.name,
        ip_address:    s.ip_address,
        mac_address:   s.mac_address,
        status:        updatedStatus,
        cpu,
        ram,
        disk,
        uptime,
        total_disk,
        recorded_at,
        created_at:    s.created_at,
      };
    })
  );

  return NextResponse.json(enriched, { status: 200 });
}

// DELETE: Remove a server and its associated metrics
export async function DELETE(req: Request) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Missing server ID for deletion.' }, { status: 400 });
  }

  const { error: metricsErr } = await supabase
    .from('server_metrics')
    .delete()
    .eq('server_id', id);

  if (metricsErr) {
    return NextResponse.json({ error: metricsErr.message }, { status: 500 });
  }

  const { error: serverErr } = await supabase
    .from('servers')
    .delete()
    .eq('id', id);

  if (serverErr) {
    return NextResponse.json({ error: serverErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Server with ID ${id} and its metrics were deleted.` }, { status: 200 });
}

// POST: Add a new server and optionally metrics
export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    ip_address,
    mac_address,
    status,
    cpu,
    ram,
    disk,
    uptime,
    total_disk,
  } = body;

  if (!name || !ip_address || !mac_address || status == null) {
    return NextResponse.json(
      { error: 'Missing required server fields.' },
      { status: 400 }
    );
  }

  const { data: serverData, error: serverErr } = await supabase
    .from('servers')
    .insert({ name, ip_address, mac_address, status })
    .select();

  if (serverErr) {
    return NextResponse.json({ error: serverErr.message }, { status: 500 });
  }

  const server = serverData?.[0];
  if (!server) {
    return NextResponse.json({ error: 'Failed to create server.' }, { status: 500 });
  }

  let createdMetrics: any = {};

  if (cpu != null && ram != null && disk != null && uptime != null) {
    const { data: metricsData, error: metricsErr } = await supabase
      .from('server_metrics')
      .insert({
        server_id: server.id,
        cpu,
        ram,
        disk,
        uptime,
        total_disk,
        recorded_at: new Date().toISOString(),
      })
      .select();

    if (metricsErr) {
      console.error('Insert metrics error:', metricsErr.message);
    } else {
      createdMetrics = metricsData?.[0] || {};
    }
  }

  return NextResponse.json(
    {
      id: server.id,
      name: server.name,
      ip_address: server.ip_address,
      mac_address: server.mac_address,
      status: server.status,
      created_at: server.created_at,
      cpu: createdMetrics.cpu ?? null,
      ram: createdMetrics.ram ?? null,
      disk: createdMetrics.disk ?? null,
      uptime: createdMetrics.uptime ?? null,
      total_disk: createdMetrics.total_disk ?? null,
      recorded_at: createdMetrics.recorded_at ?? null,
    },
    { status: 201 }
  );
}
