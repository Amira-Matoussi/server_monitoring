import { NextResponse } from 'next/server';

export async function GET() {
  // for now, return a dummy response
  const dummy = [
    { title: 'Remove temp files', estimated_savings: 0.5, difficulty: 'easy', automated: true, description: 'Temp files older than 90 days.' }
  ];
  const total = dummy.reduce((sum, r) => sum + r.estimated_savings, 0);
  return NextResponse.json({ total, recommendations: dummy });
}
