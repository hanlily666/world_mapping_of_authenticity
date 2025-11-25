/**
 * Voice Matching Utilities
 * Frontend utilities for recording audio and interacting with voice matching API
 */

import type {
  ExtractEmbeddingResponse,
  CompareVoicesResponse,
  FindMatchResponse,
  LanguageDetectionResponse,
  VoiceMatchingError,
  AudioRecordingConfig
} from '@/types/voice'

/**
 * Audio Recorder class for capturing voice input
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  /**
   * Start recording audio from the user's microphone
   */
  async startRecording(config: AudioRecordingConfig = {}): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate || 16000,
          channelCount: config.channels || 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType()
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
      })

      this.audioChunks = []

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // Start recording
      this.mediaRecorder.start()

      // Auto-stop after maxDuration if specified
      if (config.maxDuration) {
        setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            this.stopRecording()
          }
        }, config.maxDuration * 1000)
      }

    } catch (error) {
      console.error('Error starting recording:', error)
      throw new Error('Failed to access microphone. Please check permissions.')
    }
  }

  /**
   * Stop recording and return the audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        
        // Stop all tracks
        this.stream?.getTracks().forEach(track => track.stop())
        
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  /**
   * Get supported MIME type for audio recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm' // fallback
  }
}

/**
 * Convert audio blob to WAV format (if needed for better compatibility)
 */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  // For now, return as-is. Can implement WAV conversion using Web Audio API if needed
  return audioBlob
}

/**
 * Extract voice embedding from audio file
 */
export async function extractEmbedding(
  audioFile: File | Blob
): Promise<ExtractEmbeddingResponse | VoiceMatchingError> {
  try {
    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await fetch('/api/voice/extract-embedding', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error extracting embedding:', error)
    return { error: 'Failed to extract voice embedding' }
  }
}

/**
 * Compare two voice embeddings
 */
export async function compareVoices(
  embedding1: number[],
  embedding2: number[]
): Promise<CompareVoicesResponse | VoiceMatchingError> {
  try {
    const response = await fetch('/api/voice/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embedding1, embedding2 }),
    })

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error comparing voices:', error)
    return { error: 'Failed to compare voices' }
  }
}

/**
 * Find the closest matching voice from stored embeddings
 */
export async function findVoiceMatch(
  userEmbedding: number[],
  topN: number = 5
): Promise<FindMatchResponse | VoiceMatchingError> {
  try {
    const response = await fetch('/api/voice/find-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_embedding: userEmbedding,
        top_n: topN,
      }),
    })

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error finding voice match:', error)
    return { error: 'Failed to find voice match' }
  }
}

/**
 * Detect language from audio file
 */
export async function detectLanguage(
  audioFile: File | Blob
): Promise<LanguageDetectionResponse | VoiceMatchingError> {
  try {
    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await fetch('/api/voice/detect-language', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error detecting language:', error)
    return { error: 'Failed to detect language' }
  }
}

/**
 * Process uploaded audio: extract embedding and detect language
 */
export async function processVoiceUpload(audioFile: File | Blob) {
  try {
    // Extract embedding (which also detects language)
    const result = await extractEmbedding(audioFile)
    
    if ('error' in result) {
      throw new Error(result.error)
    }

    return {
      embedding: result.embedding,
      language: result.language,
      confidence: result.confidence,
    }

  } catch (error) {
    console.error('Error processing voice upload:', error)
    throw error
  }
}

/**
 * Helper function to format similarity score as percentage
 */
export function formatSimilarityScore(similarity: number): string {
  return `${(similarity * 100).toFixed(1)}%`
}

/**
 * Helper function to determine if voices match based on threshold
 */
export function isVoiceMatch(similarity: number, threshold: number = 0.7): boolean {
  return similarity >= threshold
}

/**
 * Get language name from language code
 */
export function getLanguageName(code: string): string {
  const languageNames: Record<string, string> = {
    zh: 'Chinese',
    cmn: 'Mandarin Chinese',
    yue: 'Cantonese',
    ja: 'Japanese',
    ko: 'Korean',
    th: 'Thai',
    vi: 'Vietnamese',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
  }

  return languageNames[code] || code.toUpperCase()
}

