import { NextRequest, NextResponse } from 'next/server'
import { geocode } from '@/lib/api/geocode'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 })
  }

  try {
    const results = await geocode(q)
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 })
  }
}
