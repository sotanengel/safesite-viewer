'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useQueryState, parseAsFloat } from 'nuqs'
import { useMapStore } from '@/lib/store/map-store'
import { getBasemap } from '@/lib/basemaps'
import BasemapSwitcher from './BasemapSwitcher'

const DEFAULT_LAT = 35.681236
const DEFAULT_LNG = 139.767125
const DEFAULT_ZOOM = 10

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  const [lat, setLat] = useQueryState('lat', parseAsFloat.withDefault(DEFAULT_LAT))
  const [lng, setLng] = useQueryState('lng', parseAsFloat.withDefault(DEFAULT_LNG))
  const [zoom, setZoom] = useQueryState('zoom', parseAsFloat.withDefault(DEFAULT_ZOOM))

  const basemap = useMapStore((s) => s.basemap)

  // Map initialization
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const bm = getBasemap(basemap)

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          basemap: {
            type: 'raster',
            tiles: [bm.tileUrl],
            tileSize: bm.tileSize,
            maxzoom: bm.maxzoom,
            attribution: bm.attribution,
          },
        },
        layers: [
          {
            id: 'basemap-layer',
            type: 'raster',
            source: 'basemap',
          },
        ],
      },
      center: [lng, lat],
      zoom,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right',
    )
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('moveend', () => {
      const center = map.getCenter()
      const z = map.getZoom()
      setLat(parseFloat(center.lat.toFixed(6)))
      setLng(parseFloat(center.lng.toFixed(6)))
      setZoom(parseFloat(z.toFixed(2)))
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Basemap change
  const prevBasemapRef = useRef(basemap)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (prevBasemapRef.current === basemap) return
    prevBasemapRef.current = basemap

    const bm = getBasemap(basemap)
    const source = map.getSource('basemap') as maplibregl.RasterTileSource | undefined
    if (source) {
      source.setTiles([bm.tileUrl])
    }
  }, [basemap])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10">
        <BasemapSwitcher />
      </div>
    </div>
  )
}
