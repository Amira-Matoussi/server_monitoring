import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('event_logs')
      .select('ServerName, Message')
      .eq('is_threat', 1)
      .not('ServerName', 'is', null)
      .not('Message', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format Supabase threat data
    const result: Record<string, Set<string>> = {}
    for (const item of data || []) {
      if (!result[item.ServerName]) result[item.ServerName] = new Set()
      result[item.ServerName].add(item.Message)
    }

    const supabaseOutput: Record<string, string[]> = {}
    for (const server in result) {
      supabaseOutput[server] = Array.from(result[server])
    }

    // Load forecast results from JSON file
    let forecastData = null
    try {
const filePath = path.resolve(process.cwd(), 'C:/Users/mira/Downloads/version6/backend/scripts/forecast_results.json')
      const content = await readFile(filePath, 'utf-8')
      forecastData = JSON.parse(content)
    } catch (e) {
      forecastData = { error: 'Forecast not available' }
    }

    // Combine both results
    return NextResponse.json({
      threats: supabaseOutput,
      forecast: forecastData,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

