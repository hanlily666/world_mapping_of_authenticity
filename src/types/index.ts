export interface MapClickEvent {
  lngLat: {
    lng: number
    lat: number
  }
}

export interface Submission {
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

export interface Location {
  lat: number
  lng: number
  name: string
}

export interface LightboxImage {
  url: string
  title: string
}

