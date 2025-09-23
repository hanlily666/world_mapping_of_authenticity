import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string
          created_at: string
          latitude: number
          longitude: number
          location_name: string
          voice_url: string | null
          image_url: string | null
          recipe_text: string | null
          recipe_audio_url: string | null
          user_name: string | null
          user_email: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          latitude: number
          longitude: number
          location_name: string
          voice_url?: string | null
          image_url?: string | null
          recipe_text?: string | null
          recipe_audio_url?: string | null
          user_name?: string | null
          user_email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          latitude?: number
          longitude?: number
          location_name?: string
          voice_url?: string | null
          image_url?: string | null
          recipe_text?: string | null
          recipe_audio_url?: string | null
          user_name?: string | null
          user_email?: string | null
        }
      }
    }
  }
}
