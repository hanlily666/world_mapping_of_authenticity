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
      />

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Header overlay */}
        <MapHeader />

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
