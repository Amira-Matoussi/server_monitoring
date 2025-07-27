// app/api/files/route.ts
import { NextResponse } from 'next/server'
import { supabase }   from '@/lib/supabaseClient'

export async function GET() {
  // Fetch only rows with risk_score > 50
  const { data, error } = await supabase
    .from('file_overview')
    .select(`
      server_id,
      path,
      type,
      size,
      risk_score,
      last_modified
    `)
    .gt('risk_score', 50)    // <-- this line

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
