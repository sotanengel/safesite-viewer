import { NextRequest, NextResponse } from 'next/server'
import { getSummary } from '@/lib/api/summary'

export async function GET(req: NextRequest) {
  const latStr = req.nextUrl.searchParams.get('lat')
  const lngStr = req.nextUrl.searchParams.get('lng')

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  try {
    const result = await getSummary(lat, lng)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Summary failed' }, { status: 502 })
  }
}
