"""
Voice Matching Service with Language-Based Model Routing
Uses Strategy 1: Language detection to route to appropriate ECAPA-TDNN model
"""

import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from speechbrain.inference.speaker import SpeakerRecognition
from speechbrain.inference.classifiers import EncoderClassifier
import torch
import tempfile
import logging
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple, Optional
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

class VoiceMatchingSystem:
    """
    Language-based voice matching system that routes to appropriate model
    based on detected language
    """
    
    def __init__(self):
        logger.info("Initializing Voice Matching System...")
        
        try:
            # Load CN-Celeb model for Asian languages
            logger.info("Loading CN-Celeb model...")
            self.model_asian = SpeakerRecognition.from_hparams(
                source="LanceaKing/spkrec-ecapa-cnceleb",
                savedir="pretrained_models/spkrec-ecapa-cnceleb"
            )
            
            # Load VoxCeleb model for international speakers
            logger.info("Loading VoxCeleb model...")
            self.model_voxceleb = SpeakerRecognition.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir="pretrained_models/spkrec-ecapa-voxceleb"
            )
            
            # Load language identification model
            logger.info("Loading language detection model...")
            self.lang_detector = EncoderClassifier.from_hparams(
                source="speechbrain/lang-id-voxlingua107-ecapa",
                savedir="pretrained_models/lang-id-voxlingua107-ecapa"
            )
            
            logger.info("All models loaded successfully!")
            self.models_loaded = True
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            self.models_loaded = False
            raise
    
    def detect_language(self, audio_path: str) -> Tuple[str, float]:
        """
        Detect the language of the audio file
        
        Returns:
            Tuple of (language_code, confidence_score)
        """
        try:
            signal = self.lang_detector.load_audio(audio_path)
            prediction = self.lang_detector.classify_batch(signal)
            
            # prediction format: (prob, score, index, text_lab)
            detected_lang = prediction[3][0]  # Get predicted language code
            confidence = prediction[0].max().item()  # Get confidence score
            
            logger.info(f"Detected language: {detected_lang} (confidence: {confidence:.2f})")
            return detected_lang, confidence
            
        except Exception as e:
            logger.error(f"Error detecting language: {str(e)}")
            return "unknown", 0.0
    
    def select_model(self, language: str) -> SpeakerRecognition:
        """
        Select appropriate model based on detected language
        
        Asian languages: zh (Chinese), ja (Japanese), ko (Korean), th (Thai), vi (Vietnamese)
        Other languages: Use VoxCeleb model
        """
        asian_languages = ['zh', 'ja', 'ko', 'th', 'vi', 'yue', 'cmn']
        
        if language in asian_languages:
            logger.info(f"Using CN-Celeb model for language: {language}")
            return self.model_asian
        else:
            logger.info(f"Using VoxCeleb model for language: {language}")
            return self.model_voxceleb
    
    def extract_embedding(self, audio_path: str) -> Tuple[np.ndarray, str, float]:
        """
        Extract voice embedding from audio file with language-based routing
        
        Returns:
            Tuple of (embedding_vector, detected_language, confidence)
        """
        try:
            # Step 1: Detect language
            language, confidence = self.detect_language(audio_path)
            
            # Step 2: Select appropriate model
            model = self.select_model(language)
            
            # Step 3: Extract embedding
            waveform = model.load_audio(audio_path)
            embedding = model.encode_batch(waveform)
            embedding_np = embedding.squeeze().cpu().numpy()
            
            # Normalize embedding
            embedding_np = embedding_np / np.linalg.norm(embedding_np)
            
            logger.info(f"Extracted embedding of shape: {embedding_np.shape}")
            return embedding_np, language, confidence
            
        except Exception as e:
            logger.error(f"Error extracting embedding: {str(e)}")
            raise
    
    def compare_embeddings(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compare two embeddings using cosine similarity
        
        Returns:
            Similarity score (0-1, higher is more similar)
        """
        similarity = cosine_similarity(
            embedding1.reshape(1, -1),
            embedding2.reshape(1, -1)
        )[0][0]
        
        return float(similarity)
    
    def find_closest_match(
        self, 
        user_embedding: np.ndarray, 
        stored_embeddings: List[Dict]
    ) -> Tuple[Optional[str], float, List[Dict]]:
        """
        Find the closest matching voice from stored embeddings
        
        Args:
            user_embedding: The user's voice embedding
            stored_embeddings: List of dicts with 'id', 'embedding', 'metadata'
        
        Returns:
            Tuple of (best_match_id, similarity_score, all_scores)
        """
        if not stored_embeddings:
            return None, 0.0, []
        
        scores = []
        for stored in stored_embeddings:
            stored_emb = np.array(stored['embedding'])
            similarity = self.compare_embeddings(user_embedding, stored_emb)
            
            scores.append({
                'id': stored['id'],
                'similarity': similarity,
                'metadata': stored.get('metadata', {})
            })
        
        # Sort by similarity (highest first)
        scores.sort(key=lambda x: x['similarity'], reverse=True)
        
        best_match = scores[0]
        return best_match['id'], best_match['similarity'], scores

# Initialize the voice matching system
voice_system = None

@app.before_request
def initialize_system():
    """Initialize the voice matching system on first request"""
    global voice_system
    if voice_system is None:
        try:
            voice_system = VoiceMatchingSystem()
        except Exception as e:
            logger.error(f"Failed to initialize voice system: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': voice_system.models_loaded if voice_system else False
    })

@app.route('/extract-embedding', methods=['POST'])
def extract_embedding():
    """
    Extract voice embedding from uploaded audio file
    
    Expected: multipart/form-data with 'audio' file
    Returns: JSON with embedding vector, language, and confidence
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Extract embedding
            embedding, language, confidence = voice_system.extract_embedding(temp_path)
            
            return jsonify({
                'success': True,
                'embedding': embedding.tolist(),
                'language': language,
                'confidence': float(confidence),
                'embedding_size': len(embedding)
            })
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        logger.error(f"Error in extract_embedding: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/compare-voices', methods=['POST'])
def compare_voices():
    """
    Compare two voice embeddings
    
    Expected: JSON with 'embedding1' and 'embedding2' arrays
    Returns: JSON with similarity score
    """
    try:
        data = request.json
        
        if 'embedding1' not in data or 'embedding2' not in data:
            return jsonify({'error': 'Both embedding1 and embedding2 required'}), 400
        
        embedding1 = np.array(data['embedding1'])
        embedding2 = np.array(data['embedding2'])
        
        similarity = voice_system.compare_embeddings(embedding1, embedding2)
        
        return jsonify({
            'success': True,
            'similarity': float(similarity),
            'is_match': similarity > 0.7  # Threshold for considering a match
        })
    
    except Exception as e:
        logger.error(f"Error in compare_voices: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/find-match', methods=['POST'])
def find_match():
    """
    Find the closest matching voice from a collection
    
    Expected: JSON with:
        - 'user_embedding': array of user's voice embedding
        - 'stored_embeddings': array of objects with 'id', 'embedding', 'metadata'
    
    Returns: JSON with best match info and top N matches
    """
    try:
        data = request.json
        
        if 'user_embedding' not in data or 'stored_embeddings' not in data:
            return jsonify({'error': 'user_embedding and stored_embeddings required'}), 400
        
        user_embedding = np.array(data['user_embedding'])
        stored_embeddings = data['stored_embeddings']
        top_n = data.get('top_n', 5)  # Return top 5 matches by default
        
        best_id, best_score, all_scores = voice_system.find_closest_match(
            user_embedding, 
            stored_embeddings
        )
        
        return jsonify({
            'success': True,
            'best_match': {
                'id': best_id,
                'similarity': float(best_score),
                'is_match': best_score > 0.7
            },
            'top_matches': all_scores[:top_n]
        })
    
    except Exception as e:
        logger.error(f"Error in find_match: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/detect-language', methods=['POST'])
def detect_language():
    """
    Detect language from audio file
    
    Expected: multipart/form-data with 'audio' file
    Returns: JSON with detected language and confidence
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            language, confidence = voice_system.detect_language(temp_path)
            
            return jsonify({
                'success': True,
                'language': language,
                'confidence': float(confidence)
            })
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        logger.error(f"Error in detect_language: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the Flask server
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)

