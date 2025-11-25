'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import UploadModal from '@/components/UploadModal'
import DataPointsSidebar from '@/components/DataPointsSidebar'
import ImageLightbox from '@/components/ImageLightbox'
import MapHeader from '@/components/MapHeader'
import { Submission, Location, LightboxImage, MapClickEvent } from '@/types'
import { loadSubmissions } from '@/utils/submissions'
import { reverseGeocode } from '@/utils/geocoding'
import {
  createMarker,
  navigateToLocation,
  setupMapStyle
} from '@/utils/mapUtils'

interface WorldMapProps {
  onLocationSelect?: (lat: number, lng: number) => void
}

export default function WorldMap({ onLocationSelect }: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const popupsRef = useRef<mapboxgl.Popup[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Show image lightbox
  const showImageLightbox = useCallback((imageUrl: string, title: string) => {
    setLightboxImage({ url: imageUrl, title })
  }, [])

  // Close image lightbox
  const closeLightbox = useCallback(() => {
    setLightboxImage(null)
  }, [])

  // Load submissions from database
  const handleLoadSubmissions = useCallback(async () => {
    const data = await loadSubmissions()
    setSubmissions(data)
  }, [])

  // Navigate to a submission location on the map
  const handleSubmissionClick = useCallback(
    (submission: Submission) => {
      if (!map.current) return

      // Close all existing popups
      popupsRef.current.forEach((popup) => popup.remove())
      popupsRef.current = []

      navigateToLocation(map.current, submission, submissions, markersRef.current)
    },
    [submissions]
  )

  // Navigate to a searched place on the map
  const handlePlaceSelect = useCallback(
    (lng: number, lat: number, placeName: string) => {
      if (!map.current) return

      // Close all existing popups
      popupsRef.current.forEach((popup) => popup.remove())
      popupsRef.current = []

      // Fly to the selected location
      map.current.flyTo({
        center: [lng, lat],
        zoom: 12,
        duration: 2000,
        essential: true
      })
    },
    []
  )

  // Handle sidebar collapse - resize map to fit new container
  const handleSidebarCollapseChange = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }, [])

  // Resize map smoothly when sidebar collapses/expands
  useEffect(() => {
    if (!map.current) return

    let animationFrameId: number
    const startTime = Date.now()
    const duration = 300 // Match the CSS transition duration

    const resizeMap = () => {
      if (map.current) {
        map.current.resize()
      }

      const elapsed = Date.now() - startTime
      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(resizeMap)
      }
    }

    resizeMap()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isSidebarCollapsed])

  // Create markers for submissions
  const createMarkers = useCallback(() => {
    if (!map.current) return

    // Clear existing markers and popups
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    popupsRef.current = []

    submissions.forEach((submission) => {
      const { marker, popup } = createMarker(
        map.current!,
        submission,
        showImageLightbox
      )
      markersRef.current.push(marker)
      popupsRef.current.push(popup)
    })
  }, [submissions, showImageLightbox])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      console.error('Mapbox access token is not defined')
      return
    }

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 0],
      zoom: 2,
      projection: 'globe'
    })

    const loadSubmissionsOnMapLoad = async () => {
      if (map.current) {
        // Apply custom colors immediately after load
        setTimeout(() => {
          if (map.current) {
            const layers = map.current.getStyle().layers
            layers?.forEach((layer: any) => {
              try {
                // Set water/ocean to darker yellow
                if (layer.type === 'background') {
                  map.current!.setPaintProperty(layer.id, 'background-color', '#C8A860')
                }
                if (layer.id.includes('water') || layer.id === 'water') {
                  if (layer.type === 'fill') {
                    map.current!.setPaintProperty(layer.id, 'fill-color', '#C8A860')
                  }
                }
                // Set land to lighter yellow
                if (layer.id.includes('land') || layer.id === 'land') {
                  if (layer.type === 'background' || layer.type === 'fill') {
                    const property = layer.type === 'background' ? 'background-color' : 'fill-color'
                    map.current!.setPaintProperty(layer.id, property, '#F5E6C8')
                  }
                }
              } catch (e) {
                // Ignore errors for layers that don't support these properties
              }
            })
          }
        }, 100)
        
        setupMapStyle(map.current)
        await handleLoadSubmissions()
      }
    }

    map.current.on('load', loadSubmissionsOnMapLoad)

    // Add click handler
    map.current.on('click', async (e: MapClickEvent) => {
      const { lng, lat } = e.lngLat

      const location = await reverseGeocode(lng, lat, mapboxToken)
      setSelectedLocation(location)
      setIsModalOpen(true)
      onLocationSelect?.(lat, lng)
    })

    // Change cursor on hover
    map.current.on('mouseenter', 'water', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer'
      }
    })

    map.current.on('mouseleave', 'water', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = ''
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [onLocationSelect, handleLoadSubmissions])

  // Create markers when submissions change
  useEffect(() => {
    if (map.current && submissions.length > 0) {
      createMarkers()
    }
  }, [submissions, createMarkers])

  return (
    <div className="relative w-full h-screen flex">
      {/* Sidebar */}
      <DataPointsSidebar
        submissions={submissions}
        onSubmissionClick={handleSubmissionClick}
        onCollapseChange={handleSidebarCollapseChange}
      />

      {/* Map Container */}
      <div className="flex-1 relative transition-all duration-300">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Header overlay */}
        <MapHeader 
          isSidebarCollapsed={isSidebarCollapsed} 
          onPlaceSelect={handlePlaceSelect}
        />

        {/* Upload Modal */}
        {isModalOpen && selectedLocation && (
          <UploadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            location={selectedLocation}
            onSubmissionSuccess={handleLoadSubmissions}
          />
        )}

        {/* Image Lightbox */}
        {lightboxImage && (
          <ImageLightbox image={lightboxImage} onClose={closeLightbox} />
        )}
      </div>
    </div>
  )
}
