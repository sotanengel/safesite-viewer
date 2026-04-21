'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useQueryState, parseAsFloat } from 'nuqs'
import { useMapStore } from '@/lib/store/map-store'
import { getBasemap } from '@/lib/basemaps'
import { getRasterLayers, getEffectiveTileUrl } from '@/lib/layers'
import BasemapSwitcher from './BasemapSwitcher'

const DEFAULT_LAT = 35.681236
const DEFAULT_LNG = 139.767125
const DEFAULT_ZOOM = 10

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null)

  const [lat, setLat] = useQueryState(
    'lat',
    parseAsFloat.withDefault(DEFAULT_LAT),
  )
  const [lng, setLng] = useQueryState(
    'lng',
    parseAsFloat.withDefault(DEFAULT_LNG),
  )
  const [zoom, setZoom] = useQueryState(
    'zoom',
    parseAsFloat.withDefault(DEFAULT_ZOOM),
  )

  const basemap = useMapStore((s) => s.basemap)
  const flyToTrigger = useMapStore((s) => s.flyToTrigger)
  const flyToLocation = useMapStore((s) => s.flyToLocation)
  const layerStates = useMapStore((s) => s.layerStates)
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation)
  const setMapInstance = useMapStore((s) => s.setMapInstance)

  // Map initialization — only basemap source/layer in initial style
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
        layers: [{ id: 'basemap-layer', type: 'raster', source: 'basemap' }],
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
    map.addControl(
      new maplibregl.ScaleControl({ unit: 'metric' }),
      'bottom-left',
    )

    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat
      setSelectedLocation({ lat: clickLat, lng: clickLng })
    })

    map.on('moveend', () => {
      const center = map.getCenter()
      const z = map.getZoom()
      setLat(parseFloat(center.lat.toFixed(6)))
      setLng(parseFloat(center.lng.toFixed(6)))
      setZoom(parseFloat(z.toFixed(2)))
    })

    // Apply initial visible layers once style is ready
    map.on('load', () => {
      const { layerStates: initialStates } = useMapStore.getState()
      getRasterLayers().forEach((l) => {
        const state = initialStates[l.id]
        if (!state?.visible) return
        const resolvedUrl = getEffectiveTileUrl(l)!
        map.addSource(l.id, {
          type: 'raster',
          tiles: [resolvedUrl],
          tileSize: 256,
          attribution: l.attribution,
        })
        map.addLayer({
          id: `${l.id}-layer`,
          type: 'raster',
          source: l.id,
          paint: { 'raster-opacity': state.opacity },
        })
      })
    })

    mapRef.current = map
    setMapInstance(map)

    return () => {
      map.remove()
      mapRef.current = null
      setMapInstance(null)
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
    const source = map.getSource('basemap') as
      | maplibregl.RasterTileSource
      | undefined
    if (source) {
      source.setTiles([bm.tileUrl])
    }
  }, [basemap])

  // Lazy layer loading — add source+layer when visible, remove when hidden
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    getRasterLayers().forEach((l) => {
      const state = layerStates[l.id]
      if (!state) return

      const sourceId = l.id
      const layerId = `${l.id}-layer`

      if (state.visible) {
        // Add source if not present
        if (!map.getSource(sourceId)) {
          const resolvedUrl = getEffectiveTileUrl(l)!
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [resolvedUrl],
            tileSize: 256,
            attribution: l.attribution,
          })
        }
        // Add layer if not present
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-opacity': state.opacity },
          })
        } else {
          // Layer exists — update opacity
          map.setPaintProperty(layerId, 'raster-opacity', state.opacity)
        }
      } else {
        // Remove layer then source when hidden
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId)
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId)
        }
      }
    })
  }, [layerStates])

  // Fly to location (triggered by search)
  const prevFlyTriggerRef = useRef(flyToTrigger)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToLocation) return
    if (prevFlyTriggerRef.current === flyToTrigger) return
    prevFlyTriggerRef.current = flyToTrigger

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove()
    }

    map.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: 15,
      speed: 1.5,
    })

    const el = document.createElement('div')
    el.style.cssText = `
      width: 28px; height: 28px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([flyToLocation.lng, flyToLocation.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
          `<div class="text-sm font-medium text-gray-800 max-w-[200px]">${flyToLocation.address ?? '選択地点'}</div>`,
        ),
      )
      .addTo(map)

    marker.togglePopup()
    searchMarkerRef.current = marker
  }, [flyToTrigger, flyToLocation])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10">
        <BasemapSwitcher />
      </div>
    </div>
  )
}
