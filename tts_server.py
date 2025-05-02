#!/usr/bin/env python3
"""
Script de synthèse vocale utilisant Coqui TTS pour générer une voix masculine naturelle.
Ce script peut être utilisé comme service pour l'interface NANA.
"""

import os
import sys
import time
from pathlib import Path
import tempfile
import uuid
import logging
from typing import Optional, Tuple

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("tts_server")

try:
    import torch
    from TTS.api import TTS
    from flask import Flask, request, send_file, jsonify
except ImportError:
    logger.error("Bibliothèques manquantes. Installation en cours...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "TTS", "flask"])
    
    import torch
    from TTS.api import TTS
    from flask import Flask, request, send_file, jsonify

# Configuration
OUTPUT_DIR = Path("./audio_output")
OUTPUT_DIR.mkdir(exist_ok=True)

# Serveur Flask
app = Flask(__name__)

# Modèle TTS
tts = None  # Sera initialisé au démarrage

# Liste des modèles disponibles
RECOMMENDED_MODELS = [
    # Modèles masculins de bonne qualité
    "tts_models/multilingual/multi-dataset/xtts_v2",  # Meilleure qualité, supporte français
    "tts_models/fr/mai/tacotron2-DDC",                # Spécifique français
    "tts_models/en/ljspeech/vits",                    # Anglais, haute qualité
    "tts_models/en/vctk/vits",                        # Anglais, multi-locuteurs (possibilité de choisir voix masculine)
]

def initialize_tts() -> Optional[TTS]:
    """
    Initialise le modèle TTS en essayant les modèles recommandés dans l'ordre.
    Retourne l'instance TTS ou None si aucun modèle n'a pu être chargé.
    """
    global tts
    
    if torch.cuda.is_available():
        logger.info("CUDA disponible, utilisation du GPU")
        device = "cuda"
    else:
        logger.info("CUDA non disponible, utilisation du CPU")
        device = "cpu"
    
    # Essayer les modèles jusqu'à en trouver un qui fonctionne
    for model_name in RECOMMENDED_MODELS:
        try:
            logger.info(f"Chargement du modèle {model_name}...")
            # Pour XTTS v2 (meilleure qualité et multilingue)
            if "xtts_v2" in model_name:
                tts = TTS(model_name=model_name, progress_bar=True).to(device)
                logger.info(f"Modèle {model_name} chargé avec succès")
                return tts
            # Pour les autres modèles
            else:
                tts = TTS(model_name=model_name).to(device)
                logger.info(f"Modèle {model_name} chargé avec succès")
                return tts
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle {model_name}: {e}")
    
    # Si aucun modèle n'a fonctionné
    logger.error("Aucun modèle n'a pu être chargé")
    return None

def list_available_models():
    """Liste tous les modèles disponibles dans TTS"""
    try:
        return TTS().list_models()
    except:
        return []

def generate_speech(text: str, speaker_idx: int = None) -> Tuple[str, bool]:
    """
    Génère un fichier audio à partir du texte fourni.
    
    Args:
        text: Le texte à convertir en audio
        speaker_idx: L'index du locuteur pour les modèles multi-locuteurs
    
    Returns:
        Tuple[str, bool]: (chemin du fichier audio, succès)
    """
    if tts is None:
        logger.error("Modèle TTS non initialisé")
        return "", False
    
    # Nettoyer le texte
    text = text.strip()
    if not text:
        return "", False
    
    # Générer un nom de fichier unique
    unique_id = str(uuid.uuid4())[:8]
    output_path = OUTPUT_DIR / f"output_{unique_id}.wav"
    
    try:
        # Conversion du texte en voix avec le modèle chargé
        start_time = time.time()
        
        # Modèle multi-locuteurs
        if "vctk" in tts.model_name and speaker_idx is not None:
            tts.tts_to_file(text=text, speaker=tts.speakers[speaker_idx], file_path=str(output_path))
        # Modèle XTTS v2
        elif "xtts" in tts.model_name:
            tts.tts_to_file(text=text, file_path=str(output_path), speaker="male-en-2")
        # Modèle simple
        else:
            tts.tts_to_file(text=text, file_path=str(output_path))
            
        end_time = time.time()
        logger.info(f"Audio généré en {end_time - start_time:.2f} secondes: {output_path}")
        return str(output_path), True
    except Exception as e:
        logger.error(f"Erreur lors de la génération audio: {e}")
        return "", False

def clean_old_files(max_age_hours=1):
    """Nettoie les anciens fichiers audio"""
    now = time.time()
    for file in OUTPUT_DIR.glob("*.wav"):
        if (now - file.stat().st_mtime) > max_age_hours * 3600:
            try:
                file.unlink()
                logger.info(f"Fichier supprimé: {file}")
            except Exception as e:
                logger.error(f"Erreur lors de la suppression de {file}: {e}")

# Routes Flask
@app.route("/tts", methods=["POST"])
def tts_endpoint():
    """Endpoint pour convertir du texte en parole"""
    data = request.json or {}
    text = data.get("text", "")
    speaker_idx = data.get("speaker", None)
    
    if not text:
        return jsonify({"error": "Texte requis"}), 400
    
    # Nettoyer les anciens fichiers au passage
    clean_old_files()
    
    # Générer l'audio
    output_path, success = generate_speech(text, speaker_idx)
    
    if not success:
        return jsonify({"error": "Échec de la génération de la parole"}), 500
    
    # Renvoyer le fichier audio
    return send_file(output_path, mimetype="audio/wav")

@app.route("/models", methods=["GET"])
def list_models():
    """Liste tous les modèles disponibles"""
    return jsonify({"models": list_available_models()})

@app.route("/speakers", methods=["GET"])
def list_speakers():
    """Liste tous les locuteurs disponibles pour le modèle actuel"""
    if tts and hasattr(tts, 'speakers'):
        return jsonify({"speakers": tts.speakers})
    return jsonify({"speakers": []})

@app.route("/health", methods=["GET"])
def health_check():
    """Vérification de santé du service"""
    return jsonify({
        "status": "ok" if tts is not None else "error",
        "model": tts.model_name if tts else None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    })

if __name__ == "__main__":
    # Initialiser le modèle TTS
    tts = initialize_tts()
    
    if tts is None:
        logger.error("Impossible d'initialiser le modèle TTS. Arrêt du serveur.")
        sys.exit(1)
    
    # Afficher les informations sur le modèle
    logger.info(f"Modèle chargé: {tts.model_name}")
    if hasattr(tts, 'speakers'):
        logger.info(f"Locuteurs disponibles: {tts.speakers}")
    
    # Démarrer le serveur Flask
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)