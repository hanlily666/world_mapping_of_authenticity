'use client'

import PlaceSearch from './PlaceSearch'

interface MapHeaderProps {
  isSidebarCollapsed?: boolean
  onPlaceSelect?: (lng: number, lat: number, placeName: string) => void
}

export default function MapHeader({ isSidebarCollapsed = false, onPlaceSelect }: MapHeaderProps) {
  return (
    <div 
      className="absolute top-4 right-4 z-10"
      style={{
        left: isSidebarCollapsed ? '100px' : '16px' // Account for voice memo button width + spacing
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h1 className="font-bold text-gray-800 mb-2" style={{ fontSize: '28px' }}>
          World Mapping of Authenticity
        </h1>
        <p className="text-gray-600 mb-4" style={{ fontSize: '18px' }}>
          Click anywhere on the map to share local accents, food photos, and recipes from around the world.
        </p>
        {onPlaceSelect && (
          <PlaceSearch onPlaceSelect={onPlaceSelect} />
        )}
      </div>
    </div>
  )
}

