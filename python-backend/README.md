# Voice Matching Service - Python Backend

This is a Python Flask service that provides voice matching capabilities using language-based model routing.

## Features

- **Language Detection**: Automatically detects the language of audio input
- **Model Routing**: Routes to appropriate ECAPA-TDNN model based on language
  - CN-Celeb model for Asian languages (Chinese, Japanese, Korean, Thai, Vietnamese)
  - VoxCeleb model for other languages
- **Voice Embeddings**: Extracts speaker embeddings from audio files
- **Similarity Matching**: Finds the closest matching voice from a collection

## Installation

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

### Setup

1. **Create a virtual environment** (recommended):
```bash
cd python-backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env if needed
```

### First Run

On the first run, the service will download the required models (~2GB total):
- CN-Celeb ECAPA-TDNN model
- VoxCeleb ECAPA-TDNN model
- VoxLingua107 language detection model

This may take 5-15 minutes depending on your internet connection.

## Running the Service

### Development Mode

```bash
python voice_matching_service.py
```

The service will start on `http://localhost:5000`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 voice_matching_service:app
```

## API Endpoints

### 1. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

### 2. Extract Embedding
```
POST /extract-embedding
Content-Type: multipart/form-data
```

**Request:**
- `audio`: Audio file (WAV, MP3, FLAC, etc.)

**Response:**
```json
{
  "success": true,
  "embedding": [0.123, -0.456, ...],
  "language": "zh",
  "confidence": 0.95,
  "embedding_size": 192
}
```

### 3. Compare Voices
```
POST /compare-voices
Content-Type: application/json
```

**Request:**
```json
{
  "embedding1": [0.123, -0.456, ...],
  "embedding2": [0.789, -0.012, ...]
}
```

**Response:**
```json
{
  "success": true,
  "similarity": 0.85,
  "is_match": true
}
```

### 4. Find Match
```
POST /find-match
Content-Type: application/json
```

**Request:**
```json
{
  "user_embedding": [0.123, -0.456, ...],
  "stored_embeddings": [
    {
      "id": "user1",
      "embedding": [0.789, -0.012, ...],
      "metadata": {"name": "John"}
    }
  ],
  "top_n": 5
}
```

**Response:**
```json
{
  "success": true,
  "best_match": {
    "id": "user1",
    "similarity": 0.85,
    "is_match": true
  },
  "top_matches": [...]
}
```

### 5. Detect Language
```
POST /detect-language
Content-Type: multipart/form-data
```

**Request:**
- `audio`: Audio file

**Response:**
```json
{
  "success": true,
  "language": "zh",
  "confidence": 0.95
}
```

## Supported Languages

**Asian Languages (CN-Celeb Model):**
- Chinese (zh, cmn, yue)
- Japanese (ja)
- Korean (ko)
- Thai (th)
- Vietnamese (vi)

**Other Languages (VoxCeleb Model):**
- English, Spanish, French, German, and 100+ other languages

## Performance Considerations

- **First inference**: Slower due to model initialization (~5-10 seconds)
- **Subsequent inferences**: Fast (~0.5-2 seconds per audio file)
- **Memory usage**: ~2-3GB RAM for models
- **GPU acceleration**: Automatically used if CUDA is available

## Troubleshooting

### Models not downloading
```bash
# Set cache directory
export HF_HOME=./model_cache
export TORCH_HOME=./model_cache
```

### Out of memory
- Use GPU if available
- Process one audio file at a time
- Consider using smaller batch sizes

### CORS errors
- Update `ALLOWED_ORIGINS` in `.env`
- Or modify CORS settings in `voice_matching_service.py`

## Integration with Next.js

See the main project README for how to integrate this service with your Next.js frontend.

