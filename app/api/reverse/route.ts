import { NextRequest, NextResponse } from 'next/server'
import { reverseGeocode } from '@/lib/api/reverse'

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
    const result = await reverseGeocode(lat, lng)
    if (!result) {
      return NextResponse.json({ error: 'No address found' }, { status: 404 })
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 502 })
  }
}
