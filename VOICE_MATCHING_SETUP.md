# Voice Matching Setup Guide

This guide will help you set up the voice matching functionality using language-based model routing (Strategy 1).

## Overview

The voice matching system uses:
- **Language Detection**: Automatically detects the language of voice recordings
- **Model Routing**: Routes to appropriate ECAPA-TDNN model based on language
  - CN-Celeb for Asian languages (Chinese, Japanese, Korean, Thai, Vietnamese)
  - VoxCeleb for other languages (English, Spanish, French, German, etc.)
- **Voice Embeddings**: Extracts speaker embeddings for matching similar voices

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Next.js App   │────────▶│  Python Backend │────────▶│  SpeechBrain    │
│   (Frontend)    │         │   Flask API     │         │     Models      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                            │                           │
        │                            │                    ┌──────┴──────┐
        ▼                            ▼                    │             │
┌─────────────────┐         ┌─────────────────┐    CN-Celeb    VoxCeleb
│    Supabase     │         │  Language       │    (Asian)   (International)
│    Database     │         │   Detector      │
└─────────────────┘         └─────────────────┘
```

## Prerequisites

### For Frontend (Next.js)
- Node.js 18+ and npm
- Your existing Next.js application

### For Backend (Python)
- Python 3.9 or higher
- 4GB+ RAM (8GB recommended)
- 3GB+ disk space for models
- (Optional) CUDA-enabled GPU for faster processing

## Installation Steps

### Step 1: Set Up Python Backend

1. **Navigate to the python-backend directory:**
```bash
cd python-backend
```

2. **Create a virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- SpeechBrain (voice processing)
- PyTorch (deep learning)
- NumPy & scikit-learn (for embeddings)

4. **Download models (first run):**
```bash
python voice_matching_service.py
```

The first run will download ~2GB of models:
- CN-Celeb ECAPA-TDNN (~600MB)
- VoxCeleb ECAPA-TDNN (~600MB)
- VoxLingua107 language detector (~800MB)

This may take 5-15 minutes depending on your internet speed.

### Step 2: Configure Environment Variables

1. **Create `.env` file in the root directory:**
```bash
# In the project root
cp python-backend/.env.example .env.local
```

2. **Add to `.env.local`:**
```env
# Python Backend URL
PYTHON_BACKEND_URL=http://localhost:5000

# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 3: Update Database Schema

Run this SQL in your Supabase SQL editor:

```sql
-- Add voice embedding columns to existing table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS voice_embedding FLOAT8[],
ADD COLUMN IF NOT EXISTS voice_language TEXT;

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_submissions_voice_language 
ON submissions(voice_language);
```

Or if you're setting up from scratch, use the updated `database-schema.sql` file.

### Step 4: Start the Services

**Terminal 1 - Python Backend:**
```bash
cd python-backend
source venv/bin/activate
python voice_matching_service.py
```

You should see:
```
INFO:__main__:Initializing Voice Matching System...
INFO:__main__:Loading CN-Celeb model...
INFO:__main__:Loading VoxCeleb model...
INFO:__main__:Loading language detection model...
INFO:__main__:All models loaded successfully!
 * Running on http://0.0.0.0:5000
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
```

## Usage

### 1. Using the VoiceRecorder Component

Add the component to any page:

```tsx
import VoiceRecorder from '@/components/VoiceRecorder'

export default function MyPage() {
  return (
    <div>
      <VoiceRecorder 
        maxDuration={30}
        showMatches={true}
        onMatchFound={(matches) => {
          console.log('Found matches:', matches)
          // Handle matches (e.g., show on map, navigate, etc.)
        }}
      />
    </div>
  )
}
```

### 2. Using the API Directly

```typescript
import { extractEmbedding, findVoiceMatch } from '@/utils/voiceMatching'

// Extract embedding from audio file
const result = await extractEmbedding(audioFile)
if ('error' in result) {
  console.error(result.error)
} else {
  console.log('Language:', result.language)
  console.log('Embedding:', result.embedding)
  
  // Find matches
  const matches = await findVoiceMatch(result.embedding, 5)
  console.log('Top matches:', matches)
}
```

### 3. Recording Audio Programmatically

```typescript
import { AudioRecorder } from '@/utils/voiceMatching'

const recorder = new AudioRecorder()

// Start recording
await recorder.startRecording({ maxDuration: 30 })

// Stop and get audio blob
const audioBlob = await recorder.stopRecording()

// Process it
const result = await extractEmbedding(audioBlob)
```

### 4. Storing Embeddings with Submissions

Update your submission handler to include voice embeddings:

```typescript
import { extractEmbedding } from '@/utils/voiceMatching'
import { createClient } from '@/lib/supabase'

async function handleSubmission(audioFile: File, otherData: any) {
  // Extract voice embedding
  const voiceResult = await extractEmbedding(audioFile)
  
  if ('error' in voiceResult) {
    throw new Error('Failed to process voice')
  }
  
  // Upload audio to Supabase Storage
  const supabase = createClient()
  const fileName = `voice_${Date.now()}.webm`
  const { data: uploadData } = await supabase.storage
    .from('voice-recordings')
    .upload(fileName, audioFile)
  
  // Save to database with embedding
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      ...otherData,
      voice_url: uploadData?.path,
      voice_embedding: voiceResult.embedding,
      voice_language: voiceResult.language
    })
  
  return data
}
```

## API Endpoints

The Python backend provides these endpoints:

### Health Check
```
GET http://localhost:5000/health
```

### Extract Embedding
```
POST http://localhost:5000/extract-embedding
Content-Type: multipart/form-data
Body: audio file
```

### Compare Voices
```
POST http://localhost:5000/compare-voices
Content-Type: application/json
Body: { embedding1: [...], embedding2: [...] }
```

### Find Match
```
POST http://localhost:5000/find-match
Content-Type: application/json
Body: { user_embedding: [...], stored_embeddings: [...] }
```

### Detect Language
```
POST http://localhost:5000/detect-language
Content-Type: multipart/form-data
Body: audio file
```

## Testing

### Test Python Backend

```bash
# From python-backend directory
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

### Test with Audio File

```bash
# Extract embedding from test audio
curl -X POST http://localhost:5000/extract-embedding \
  -F "audio=@test_audio.wav"
```

### Test Next.js API Routes

```bash
# From your Next.js app
curl -X POST http://localhost:3000/api/voice/extract-embedding \
  -F "audio=@test_audio.wav"
```

## Performance

### First Request
- **Time**: 5-10 seconds (model initialization)
- **Memory**: 2-3GB RAM

### Subsequent Requests
- **Time**: 0.5-2 seconds per audio file
- **Memory**: Stays at 2-3GB RAM

### With GPU
- **Time**: 0.2-0.5 seconds per audio file
- **Memory**: ~1GB GPU VRAM

## Troubleshooting

### Python Backend Won't Start

**Issue**: Models not downloading
```bash
# Set cache directory
export HF_HOME=./model_cache
export TORCH_HOME=./model_cache
python voice_matching_service.py
```

**Issue**: Out of memory
- Close other applications
- Use a machine with more RAM
- Consider cloud deployment (AWS, GCP, Azure)

### CORS Errors

Update CORS settings in `voice_matching_service.py`:
```python
CORS(app, origins=["http://localhost:3000", "https://yourdomain.com"])
```

### No Matches Found

- Ensure submissions have voice_embedding stored
- Check that Python backend is running
- Verify PYTHON_BACKEND_URL is correct in .env.local

## Deployment

### Python Backend Deployment

**Option 1: Docker**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "voice_matching_service:app"]
```

**Option 2: Cloud Services**
- **Heroku**: Use Procfile with gunicorn
- **AWS**: Deploy on EC2 with GPU or ECS
- **Google Cloud**: Use Cloud Run with GPU
- **Azure**: Azure Container Instances

### Next.js Deployment

Deploy as usual to Vercel, but update `PYTHON_BACKEND_URL` to point to your deployed Python service.

## Advanced: Upgrading to Ensemble Models

If you want to upgrade to Strategy 2 (ensembling both models), see the Python backend code comments for implementation details.

## Support

For issues:
1. Check the Python backend logs
2. Check Next.js console for errors
3. Verify all environment variables are set
4. Ensure database schema is updated

## Summary

You now have a complete voice matching system with:
- ✅ Language detection
- ✅ Automatic model routing
- ✅ Voice embedding extraction
- ✅ Similarity matching
- ✅ React component ready to use
- ✅ Full API integration

The system will automatically route Chinese/Asian voices to the CN-Celeb model and other languages to the VoxCeleb model for optimal accuracy!

