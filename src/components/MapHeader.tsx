'use client'

export default function MapHeader() {
  return (
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
  )
}

