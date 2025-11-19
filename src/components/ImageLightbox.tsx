'use client'

import { LightboxImage } from '@/types'

interface ImageLightboxProps {
  image: LightboxImage
  onClose: () => void
}

export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-all"
          style={{ zIndex: 51 }}
        >
          ✕
        </button>
        <img
          src={image.url}
          alt={image.title}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 rounded-lg p-3">
          <h3 className="font-bold text-lg">{image.title}</h3>
        </div>
      </div>
    </div>
  )
}

