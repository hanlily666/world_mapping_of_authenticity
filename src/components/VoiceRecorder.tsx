'use client'

/**
 * Voice Recorder Component
 * Allows users to record their voice and find matching voices
 */

import { useState, useRef } from 'react'
import { AudioRecorder, extractEmbedding, findVoiceMatch, formatSimilarityScore, getLanguageName } from '@/utils/voiceMatching'
import type { VoiceMatchResult } from '@/types/voice'

interface VoiceRecorderProps {
  onMatchFound?: (matches: VoiceMatchResult[]) => void
  maxDuration?: number
  showMatches?: boolean
}

export default function VoiceRecorder({ 
  onMatchFound, 
  maxDuration = 30,
  showMatches = true 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [matches, setMatches] = useState<VoiceMatchResult[]>([])
  const [recordingTime, setRecordingTime] = useState(0)

  const recorderRef = useRef<AudioRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      setError(null)
      setAudioBlob(null)
      setMatches([])
      setDetectedLanguage(null)
      setRecordingTime(0)

      recorderRef.current = new AudioRecorder()
      await recorderRef.current.startRecording({ maxDuration })
      
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return prev + 1
        })
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      console.error('Recording error:', err)
    }
  }

  const stopRecording = async () => {
    if (!recorderRef.current) return

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      const blob = await recorderRef.current.stopRecording()
      setAudioBlob(blob)
      setIsRecording(false)

      // Automatically process the recording
      await processRecording(blob)

    } catch (err) {
      setError('Failed to stop recording')
      console.error('Stop recording error:', err)
    }
  }

  const processRecording = async (blob: Blob) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Extract embedding
      const embeddingResult = await extractEmbedding(blob)

      if ('error' in embeddingResult) {
        throw new Error(embeddingResult.error)
      }

      setDetectedLanguage(embeddingResult.language)

      // Find matches
      const matchResult = await findVoiceMatch(embeddingResult.embedding, 5)

      if ('error' in matchResult) {
        throw new Error(matchResult.error)
      }

      setMatches(matchResult.top_matches || [])

      if (onMatchFound && matchResult.top_matches) {
        onMatchFound(matchResult.top_matches)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process recording')
      console.error('Processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="voice-recorder bg-white rounded-lg shadow-md p-6 max-w-md">
      <h3 className="text-xl font-bold mb-4">Voice Matching</h3>

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🎤 Start Recording
          </button>
        )}

        {isRecording && (
          <div className="flex flex-col items-center space-y-3">
            <div className="recording-indicator flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
            >
              ⏹️ Stop Recording
            </button>
            <p className="text-sm text-gray-500">Max duration: {maxDuration}s</p>
          </div>
        )}

        {audioBlob && !isRecording && (
          <div className="flex flex-col items-center space-y-3">
            <div className="text-green-600 font-semibold">✓ Recording complete</div>
            <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-gray-400"
            >
              🔄 Record Again
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Processing voice...</span>
          </div>
        )}

        {/* Language Detection */}
        {detectedLanguage && (
          <div className="text-sm bg-blue-50 px-4 py-2 rounded">
            Detected Language: <strong>{getLanguageName(detectedLanguage)}</strong>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 bg-red-50 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Match Results */}
      {showMatches && matches.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Top Matches:</h4>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className={`p-3 rounded border ${
                  match.is_match 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      {index === 0 && '🏆 '}
                      {match.metadata?.user_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {match.metadata?.location_name || 'Unknown location'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatSimilarityScore(match.similarity)}
                    </div>
                    {match.is_match && (
                      <div className="text-xs text-green-600 font-semibold">
                        Match!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && audioBlob && !isProcessing && !error && (
        <div className="mt-6 text-center text-gray-500">
          No matches found. Be the first to add your voice!
        </div>
      )}
    </div>
  )
}

