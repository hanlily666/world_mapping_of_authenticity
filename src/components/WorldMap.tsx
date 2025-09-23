'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import UploadModal from '@/components/UploadModal'
import { supabase } from '@/lib/supabase'

interface MapClickEvent {
  lngLat: {
    lng: number
    lat: number
  }
}

interface Submission {
  id: string
  latitude: number
  longitude: number
  location_name: string
  voice_url: string | null
  image_url: string | null
  recipe_text: string | null
  recipe_audio_url: string | null
  user_name: string | null
  user_email: string | null
  created_at: string
}

interface WorldMapProps {
  onLocationSelect?: (lat: number, lng: number) => void
}

export default function WorldMap({ onLocationSelect }: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const markersRef = useRef<mapboxgl.Marker[]>([])

  // Load submissions from database
  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading submissions:', error)
        return
      }

      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  // Create markers for submissions
  const createMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    submissions.forEach((submission) => {
      // Create custom marker element
      const markerElement = document.createElement('div')
      markerElement.className = 'custom-marker'
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #dc2626;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `
      
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)'
      })
      
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)'
      })

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([submission.longitude, submission.latitude])
        .addTo(map.current!)

      // Create popup content
      const popupContent = `
        <div class="p-4 rounded-lg max-w-md" style="background-color: #F7D5CE; border: 1px solid #689183; font-size: 16px;">
          <h3 class="font-bold mb-2" style="color: #689183; font-size: 20px;">${submission.location_name}</h3>
          <p class="mb-2" style="color: #689183; font-size: 16px;">${submission.user_name ? `By: ${submission.user_name}` : 'Anonymous'}</p>
          ${submission.recipe_text ? `<p class="mb-3" style="color: #689183; font-size: 16px;">${submission.recipe_text.substring(0, 120)}${submission.recipe_text.length > 120 ? '...' : ''}</p>` : ''}
          <div class="flex space-x-3" style="font-size: 16px;">
            ${submission.voice_url ? '<span style="color: #689183;">🎤 Voice</span>' : ''}
            ${submission.image_url ? '<span style="color: #689183;">📸 Photo</span>' : ''}
            ${submission.recipe_audio_url ? '<span style="color: #689183;">🍳 Recipe Audio</span>' : ''}
          </div>
        </div>
      `

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(popupContent)

      marker.setPopup(popup)
      markersRef.current.push(marker)
    })
  }

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

    map.current.on('load', async () => {
      if (map.current) {
        // Add 3D atmosphere effect for globe appearance
        map.current.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        })

        // Enhance text label visibility and sizing
        const style = map.current.getStyle()
        if (style.layers) {
          style.layers.forEach((layer: any) => {
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
              // Increase text size for all text labels
              if (layer.layout['text-size']) {
                if (typeof layer.layout['text-size'] === 'number') {
                  layer.layout['text-size'] = layer.layout['text-size'] * 1.2
                } else if (layer.layout['text-size'].stops) {
                  layer.layout['text-size'].stops = layer.layout['text-size'].stops.map((stop: any) => [stop[0], stop[1] * 1.2])
                }
              } else {
                layer.layout['text-size'] = 14
              }
              
              // Ensure text has good contrast
              if (layer.paint) {
                layer.paint['text-halo-color'] = 'rgba(255, 255, 255, 0.8)'
                layer.paint['text-halo-width'] = 1
                layer.paint['text-color'] = '#333333'
              }
            }
          })
          map.current.setStyle(style)
        }
      }
      // Load submissions and create markers
      await loadSubmissions()
    })

    // Add click handler
    map.current.on('click', (e: MapClickEvent) => {
      const { lng, lat } = e.lngLat
      
      // Reverse geocoding to get location name
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`)
        .then(response => response.json())
        .then(data => {
          const locationName = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setSelectedLocation({ lat, lng, name: locationName })
          setIsModalOpen(true)
          onLocationSelect?.(lat, lng)
        })
        .catch(error => {
          console.error('Error reverse geocoding:', error)
          setSelectedLocation({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
          setIsModalOpen(true)
          onLocationSelect?.(lat, lng)
        })
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
  }, [onLocationSelect])

  // Create markers when submissions change
  useEffect(() => {
    if (map.current && submissions.length > 0) {
      createMarkers()
    }
  }, [submissions])

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Header overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h1 className="font-bold text-gray-800 mb-2" style={{ fontSize: '28px' }}>
            World Mapping of Authenticity
          </h1>
          <p className="text-gray-600" style={{ fontSize: '18px' }}>
            Click anywhere on the map to share local accents, food photos, and recipes from around the world.
          </p>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && selectedLocation && (
        <UploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
          onSubmissionSuccess={() => {
            // Reload submissions to show new marker
            loadSubmissions()
          }}
        />
      )}
    </div>
  )
}
