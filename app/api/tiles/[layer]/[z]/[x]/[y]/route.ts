import { type NextRequest, NextResponse } from 'next/server'
import { getTilesDb } from '@/lib/tiles-db'
import { LAYER_MAP } from '@/lib/layers'

// Minimal 1×1 transparent PNG for missing sparse tiles
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

type Params = { layer: string; z: string; x: string; y: string }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { layer, z, x, y } = await params

  const db = getTilesDb()
  if (db) {
    const row = db
      .prepare(
        'SELECT tile_data FROM tiles WHERE layer=? AND zoom_level=? AND tile_col=? AND tile_row=?',
      )
      .get(layer, parseInt(z), parseInt(x), parseInt(y)) as
      | { tile_data: Buffer }
      | undefined

    if (row) {
      return new NextResponse(row.tile_data as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  }

  // Tile not in local DB — redirect to the original upstream tile server.
  // For terrain layers outside Kanto this requires an internet connection;
  // for hazard layers a missing tile means no hazard data at that location.
  const layerDef = LAYER_MAP[layer]
  if (layerDef?.tileUrl) {
    const url = layerDef.tileUrl
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y)
    return NextResponse.redirect(url, { status: 307 })
  }

  return new NextResponse(TRANSPARENT_PNG as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  })
}
