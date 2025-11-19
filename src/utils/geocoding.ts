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

