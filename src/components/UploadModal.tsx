'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Location } from '@/types'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  location: Location
  onSubmissionSuccess?: () => void
}

export default function UploadModal({ isOpen, onClose, location, onSubmissionSuccess }: UploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    recipeText: ''
  })
  const [files, setFiles] = useState({
    voice: null as File | null,
    image: null as File | null,
    recipeAudio: null as File | null
  })

  const voiceInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const recipeAudioInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (type: 'voice' | 'image' | 'recipeAudio', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }))
  }

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      // Upload files
      const voiceUrl = files.voice ? await uploadFile(files.voice, 'voice-recordings') : null
      const imageUrl = files.image ? await uploadFile(files.image, 'images') : null
      const recipeAudioUrl = files.recipeAudio ? await uploadFile(files.recipeAudio, 'recipe-audio') : null

      // Save submission to database
      const { error } = await supabase
        .from('submissions')
        .insert({
          latitude: location.lat,
          longitude: location.lng,
          location_name: location.name,
          voice_url: voiceUrl,
          image_url: imageUrl,
          recipe_text: formData.recipeText || null,
          recipe_audio_url: recipeAudioUrl,
          user_name: formData.userName || null,
          user_email: formData.userEmail || null
        })

      if (error) {
        console.error('Error saving submission:', error)
        alert('Error saving your submission. Please try again.')
      } else {
        alert('Thank you for your submission! Your local authenticity has been added to the map.')
        onClose()
        // Reset form
        setFormData({ userName: '', userEmail: '', recipeText: '' })
        setFiles({ voice: null, image: null, recipeAudio: null })
        // Notify parent component to refresh markers
        onSubmissionSuccess?.()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 modal-scroll" style={{ backgroundColor: '#F7D5CE', borderColor: '#689183', fontSize: '16px' }}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold" style={{ color: '#689183', fontSize: '24px' }}>
              Share Local Authenticity
            </h2>
            <button
              onClick={onClose}
              className="hover:opacity-70"
              style={{ color: '#689183', fontSize: '24px' }}
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: '#F7D5CE', borderColor: '#689183' }}>
            <p style={{ color: '#689183', fontSize: '16px' }}>
              <strong>Location:</strong> {location.name}
            </p>
            <p style={{ color: '#689183', fontSize: '16px' }}>
              Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1" style={{ color: '#689183', fontSize: '16px' }}>
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#689183', backgroundColor: '#F7D5CE', color: '#689183', fontSize: '16px' }}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block font-medium mb-1" style={{ color: '#689183', fontSize: '16px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#689183', backgroundColor: '#F7D5CE', color: '#689183', fontSize: '16px' }}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Voice Recording Upload */}
            <div>
              <label className="block font-medium mb-2" style={{ color: '#689183', fontSize: '16px' }}>
                Local Accent Recording
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: '#689183', backgroundColor: '#F7D5CE' }}>
                <input
                  ref={voiceInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange('voice', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => voiceInputRef.current?.click()}
                  className="font-medium hover:opacity-70"
                  style={{ color: '#689183', fontSize: '16px' }}
                >
                  {files.voice ? files.voice.name : 'Click to upload voice recording'}
                </button>
                <p className="mt-1" style={{ color: '#689183', fontSize: '16px' }}>
                  Record yourself speaking in the local accent
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block font-medium mb-2" style={{ color: '#689183', fontSize: '16px' }}>
                Local Food Photo
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: '#689183', backgroundColor: '#F7D5CE' }}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('image', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="font-medium hover:opacity-70"
                  style={{ color: '#689183', fontSize: '16px' }}
                >
                  {files.image ? files.image.name : 'Click to upload food photo'}
                </button>
                <p className="mt-1" style={{ color: '#689183', fontSize: '16px' }}>
                  Share a photo of local food or recipe
                </p>
              </div>
            </div>

            {/* Recipe Text */}
            <div>
              <label className="block font-medium mb-2" style={{ color: '#689183', fontSize: '16px' }}>
                Recipe Description (Optional)
              </label>
              <textarea
                value={formData.recipeText}
                onChange={(e) => setFormData(prev => ({ ...prev, recipeText: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                style={{ borderColor: '#689183', backgroundColor: '#F7D5CE', color: '#689183', fontSize: '16px' }}
                placeholder="Describe the local recipe, ingredients, or cooking method..."
              />
            </div>

            {/* Recipe Audio Upload */}
            <div>
              <label className="block font-medium mb-2" style={{ color: '#689183', fontSize: '16px' }}>
                Recipe Audio Recording (Optional)
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: '#689183', backgroundColor: '#F7D5CE' }}>
                <input
                  ref={recipeAudioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange('recipeAudio', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => recipeAudioInputRef.current?.click()}
                  className="font-medium hover:opacity-70"
                  style={{ color: '#689183', fontSize: '16px' }}
                >
                  {files.recipeAudio ? files.recipeAudio.name : 'Click to upload recipe audio'}
                </button>
                <p className="mt-1" style={{ color: '#689183', fontSize: '16px' }}>
                  Record yourself explaining the recipe
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:opacity-70"
                style={{ color: '#689183', borderColor: '#689183', backgroundColor: '#F7D5CE', fontSize: '16px' }}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#689183', fontSize: '16px' }}
              >
                {isUploading ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
