import { Location } from '@/types'

export async function reverseGeocode(
  lng: number,
  lat: number,
  mapboxToken: string
): Promise<Location> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
    )
    const data = await response.json()
    const locationName =
      data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    return { lat, lng, name: locationName }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
  }
}

export interface PlaceResult {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
  place_type: string[]
}

export async function forwardGeocode(
  query: string,
  mapboxToken: string
): Promise<PlaceResult[]> {
  try {
    if (!query.trim()) return []
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${mapboxToken}&types=place,locality,neighborhood,address,poi&limit=5`
    )
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.error('Error forward geocoding:', error)
    return []
  }
}

