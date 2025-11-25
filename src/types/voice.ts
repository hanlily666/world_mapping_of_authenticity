/**
 * Voice Matching Types and Interfaces
 */

export interface VoiceEmbedding {
  id: string
  embedding: number[]
  language: string
  confidence: number
  created_at: string
  metadata?: {
    user_name?: string
    location?: string
    [key: string]: any
  }
}

export interface VoiceMatchResult {
  id: string
  similarity: number
  is_match: boolean
  metadata?: {
    user_name?: string
    location?: string
    [key: string]: any
  }
}

export interface ExtractEmbeddingResponse {
  success: boolean
  embedding: number[]
  language: string
  confidence: number
  embedding_size: number
}

export interface CompareVoicesResponse {
  success: boolean
  similarity: number
  is_match: boolean
}

export interface FindMatchResponse {
  success: boolean
  best_match: VoiceMatchResult
  top_matches: VoiceMatchResult[]
}

export interface LanguageDetectionResponse {
  success: boolean
  language: string
  confidence: number
}

export interface VoiceMatchingError {
  error: string
  details?: string
}

// Audio recording configuration
export interface AudioRecordingConfig {
  sampleRate?: number
  channels?: number
  bitsPerSample?: number
  maxDuration?: number // in seconds
}

// Language codes supported by the system
export const ASIAN_LANGUAGES = ['zh', 'ja', 'ko', 'th', 'vi', 'yue', 'cmn'] as const
export const SUPPORTED_LANGUAGES = [
  ...ASIAN_LANGUAGES,
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi'
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]

// Helper type for submission with voice embedding
export interface SubmissionWithVoiceEmbedding {
  id: string
  latitude: number
  longitude: number
  location_name: string
  voice_url: string | null
  voice_embedding?: VoiceEmbedding
  image_url: string | null
  recipe_text: string | null
  recipe_audio_url: string | null
  user_name: string | null
  user_email: string | null
  created_at: string
}

