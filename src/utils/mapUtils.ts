import mapboxgl from 'mapbox-gl'
import { Submission } from '@/types'

export function createMarkerElement(): HTMLDivElement {
  const markerElement = document.createElement('div')
  markerElement.className = 'custom-marker'
  markerElement.style.cssText = `
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #dc2626;
    border: 3px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: box-shadow 0.2s, background-color 0.2s;
    position: relative;
    transform-origin: center center;
  `

  markerElement.addEventListener('mouseenter', () => {
    markerElement.style.backgroundColor = '#b91c1c'
    markerElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
  })

  markerElement.addEventListener('mouseleave', () => {
    markerElement.style.backgroundColor = '#dc2626'
    markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
  })

  return markerElement
}

export function createPopupContent(
  submission: Submission,
  onImageClick: (imageUrl: string, title: string) => void
): HTMLDivElement {
  const popupContent = document.createElement('div')
  popupContent.className = 'p-4 rounded-lg max-w-sm'
  popupContent.style.cssText = `
    background-color: #F7D5CE;
    border: 1px solid #689183;
    font-size: 16px;
    max-width: 320px;
  `

  // Header
  const header = document.createElement('div')
  header.innerHTML = `
    <h3 class="font-bold mb-2" style="color: #689183; font-size: 18px;">${submission.location_name}</h3>
    <p class="mb-3" style="color: #689183; font-size: 14px;">${submission.user_name ? `By: ${submission.user_name}` : 'Anonymous'}</p>
  `
  popupContent.appendChild(header)

  // Recipe text
  if (submission.recipe_text) {
    const recipeDiv = document.createElement('div')
    recipeDiv.innerHTML = `<p class="mb-3" style="color: #689183; font-size: 14px;">${submission.recipe_text.substring(0, 120)}${submission.recipe_text.length > 120 ? '...' : ''}</p>`
    popupContent.appendChild(recipeDiv)
  }

  // Media section
  const mediaDiv = document.createElement('div')
  mediaDiv.className = 'space-y-2'

  // Voice recording
  if (submission.voice_url) {
    const voiceDiv = document.createElement('div')
    voiceDiv.innerHTML = `
      <div class="flex items-center space-x-2 mb-2">
        <span style="color: #689183; font-size: 14px;">🎤 Voice Recording</span>
      </div>
    `
    const audioPlayer = document.createElement('audio')
    audioPlayer.controls = true
    audioPlayer.style.cssText = 'width: 100%; height: 32px;'
    audioPlayer.src = submission.voice_url
    voiceDiv.appendChild(audioPlayer)
    mediaDiv.appendChild(voiceDiv)
  }

  // Recipe audio
  if (submission.recipe_audio_url) {
    const recipeAudioDiv = document.createElement('div')
    recipeAudioDiv.innerHTML = `
      <div class="flex items-center space-x-2 mb-2">
        <span style="color: #689183; font-size: 14px;">🍳 Recipe Audio</span>
      </div>
    `
    const audioPlayer = document.createElement('audio')
    audioPlayer.controls = true
    audioPlayer.style.cssText = 'width: 100%; height: 32px;'
    audioPlayer.src = submission.recipe_audio_url
    recipeAudioDiv.appendChild(audioPlayer)
    mediaDiv.appendChild(recipeAudioDiv)
  }

  // Image
  if (submission.image_url) {
    const imageDiv = document.createElement('div')
    imageDiv.innerHTML = `
      <div class="flex items-center space-x-2 mb-2">
        <span style="color: #689183; font-size: 14px;">📸 Photo</span>
      </div>
    `
    const imageContainer = document.createElement('div')
    imageContainer.style.cssText = 'cursor: pointer; position: relative;'

    const img = document.createElement('img')
    img.src = submission.image_url
    img.alt = 'Submission photo'
    img.style.cssText = `
      width: 100%;
      max-height: 150px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #689183;
    `

    imageContainer.addEventListener('click', (e) => {
      e.stopPropagation()
      onImageClick(submission.image_url!, submission.location_name)
    })

    imageContainer.appendChild(img)
    imageDiv.appendChild(imageContainer)
    mediaDiv.appendChild(imageDiv)
  }

  popupContent.appendChild(mediaDiv)
  return popupContent
}

export function createMarker(
  map: mapboxgl.Map,
  submission: Submission,
  onImageClick: (imageUrl: string, title: string) => void
): { marker: mapboxgl.Marker; popup: mapboxgl.Popup } {
  const markerElement = createMarkerElement()
  const popupContent = createPopupContent(submission, onImageClick)

  const marker = new mapboxgl.Marker({
    element: markerElement,
    anchor: 'center'
  })
    .setLngLat([submission.longitude, submission.latitude])
    .addTo(map)

  const popup = new mapboxgl.Popup({
    offset: 25,
    closeButton: true,
    className: 'custom-popup',
    maxWidth: '320px'
  }).setDOMContent(popupContent)

  marker.setPopup(popup)

  markerElement.addEventListener('click', (e) => {
    e.stopPropagation()
    marker.togglePopup()
  })

  return { marker, popup }
}

export function navigateToLocation(
  map: mapboxgl.Map,
  submission: Submission,
  submissions: Submission[],
  markers: mapboxgl.Marker[]
): void {
  // Fly to the location
  map.flyTo({
    center: [submission.longitude, submission.latitude],
    zoom: 10,
    duration: 1500
  })

  // Find the marker and open its popup after animation
  setTimeout(() => {
    const submissionIndex = submissions.findIndex((s) => s.id === submission.id)
    if (submissionIndex !== -1 && markers[submissionIndex]) {
      markers[submissionIndex].togglePopup()
    }
  }, 1600)
}

export function setupMapStyle(map: mapboxgl.Map): void {
  // Add 3D atmosphere effect for globe appearance with sepia tone
  map.setFog({
    color: 'rgb(230, 210, 160)',
    'high-color': 'rgb(200, 180, 120)',
    'horizon-blend': 0.02,
    'space-color': 'rgb(40, 35, 25)',
    'star-intensity': 0.3
  })

  // Customize map colors and text
  const style = map.getStyle()
  if (style.layers) {
    style.layers.forEach((layer: any) => {
      // Change water/ocean color to darker yellow
      if (layer.id === 'water' || layer.type === 'background') {
        if (!layer.paint) layer.paint = {}
        layer.paint['background-color'] = '#C8A860'
      }
      
      // Change water layer colors
      if (layer.source === 'composite' && layer['source-layer'] === 'water') {
        if (!layer.paint) layer.paint = {}
        layer.paint['fill-color'] = '#C8A860'
      }
      
      // Change land/ground color to lighter yellow
      if (layer.id === 'land' || layer.id === 'landcover' || 
          (layer['source-layer'] && (
            layer['source-layer'].includes('land') || 
            layer['source-layer'] === 'landuse'
          ))) {
        if (!layer.paint) layer.paint = {}
        if (layer.type === 'fill') {
          layer.paint['fill-color'] = '#F5E6C8'
        } else if (layer.type === 'background') {
          layer.paint['background-color'] = '#F5E6C8'
        }
      }

      // Update text labels for better visibility on yellow background
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        // Increase text size for all text labels
        if (layer.layout['text-size']) {
          if (typeof layer.layout['text-size'] === 'number') {
            layer.layout['text-size'] = layer.layout['text-size'] * 1.2
          } else if (layer.layout['text-size'].stops) {
            layer.layout['text-size'].stops = layer.layout['text-size'].stops.map(
              (stop: any) => [stop[0], stop[1] * 1.2]
            )
          }
        } else {
          layer.layout['text-size'] = 14
        }

        // Make text dark for better contrast on yellow background
        if (!layer.paint) layer.paint = {}
        layer.paint['text-halo-color'] = 'rgba(255, 250, 240, 0.9)'
        layer.paint['text-halo-width'] = 1.5
        layer.paint['text-color'] = '#2c2416'
      }
    })
    map.setStyle(style)
  }
}

