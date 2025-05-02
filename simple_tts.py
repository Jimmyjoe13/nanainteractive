#!/usr/bin/env python3
"""
Script simple de synthèse vocale avec Coqui TTS.
Permet de convertir du texte en parole avec une voix masculine naturelle.
"""

import os
import sys
import time
from pathlib import Path

# Vérifier si les bibliothèques nécessaires sont installées
try:
    import torch
    from TTS.api import TTS
    import simpleaudio as sa
except ImportError:
    print("Installation des bibliothèques requises...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "TTS", "simpleaudio"])
    
    import torch
    from TTS.api import TTS
    import simpleaudio as sa

# Configuration
OUTPUT_DIR = Path("./audio_output")
OUTPUT_DIR.mkdir(exist_ok=True)
DEFAULT_OUTPUT = OUTPUT_DIR / "output.wav"

# Liste des meilleurs modèles pour voix masculine naturelle
RECOMMENDED_MODELS = [
    "tts_models/multilingual/multi-dataset/xtts_v2",  # Meilleure qualité, supporte français
    "tts_models/fr/mai/tacotron2-DDC",                # Spécifique français
    "tts_models/en/ljspeech/vits",                    # Anglais, haute qualité
    "tts_models/en/vctk/vits",                        # Anglais, multi-locuteurs
]

def initialize_tts():
    """Initialise le modèle TTS"""
    # Déterminer le device (GPU ou CPU)
    if torch.cuda.is_available():
        print("GPU disponible. Utilisation de CUDA.")
        device = "cuda"
    else:
        print("Utilisation du CPU.")
        device = "cpu"
    
    # Essayer les modèles dans l'ordre jusqu'à trouver un qui fonctionne
    for model_name in RECOMMENDED_MODELS:
        try:
            print(f"Chargement du modèle {model_name}...")
            start_time = time.time()
            
            # Pour XTTS v2 (meilleure qualité)
            if "xtts_v2" in model_name:
                tts = TTS(model_name=model_name, progress_bar=True).to(device)
            else:
                tts = TTS(model_name=model_name).to(device)
                
            end_time = time.time()
            print(f"Modèle chargé en {end_time - start_time:.2f} secondes.")
            
            # Afficher les informations du modèle
            print(f"Modèle: {tts.model_name}")
            if hasattr(tts, 'speakers') and tts.speakers:
                print(f"Locuteurs disponibles: {tts.speakers}")
                
            return tts
        except Exception as e:
            print(f"Erreur avec {model_name}: {e}")
            continue
    
    print("ERREUR: Aucun modèle n'a pu être chargé.")
    return None

def speak(text, output_file=None, play=True):
    """
    Convertit le texte en voix et optionnellement joue le son.
    
    Args:
        text (str): Texte à convertir en voix
        output_file (str, optional): Chemin du fichier de sortie
        play (bool): Jouer le son après la génération
        
    Returns:
        str: Chemin du fichier audio généré
    """
    global tts
    
    if tts is None:
        print("Modèle TTS non chargé.")
        return None
        
    if not text:
        print("Texte vide, rien à faire.")
        return None
    
    # Définir le fichier de sortie
    if output_file is None:
        output_file = DEFAULT_OUTPUT
    
    # Paramètres spécifiques selon le modèle    
    try:
        start_time = time.time()
        print(f"Génération de l'audio pour: '{text}'")
        
        # Si c'est XTTS, on peut spécifier une voix "male"
        if "xtts" in tts.model_name:
            tts.tts_to_file(text=text, file_path=str(output_file), speaker="male-en-2")
        # Si c'est VCTK, on peut choisir un locuteur masculin
        elif "vctk" in tts.model_name and hasattr(tts, 'speakers'):
            # Choisir un locuteur masculin (généralement p226 à p234 sont masculins)
            speaker = "p226"  # Voix masculine par défaut
            tts.tts_to_file(text=text, file_path=str(output_file), speaker=speaker)
        # Autre modèle
        else:
            tts.tts_to_file(text=text, file_path=str(output_file))
        
        end_time = time.time()
        print(f"Audio généré en {end_time - start_time:.2f} secondes: {output_file}")
        
        # Jouer le son
        if play:
            print("Lecture du fichier audio...")
            play_audio(output_file)
            
        return str(output_file)
        
    except Exception as e:
        print(f"Erreur lors de la génération audio: {e}")
        return None

def play_audio(file_path):
    """Joue un fichier audio WAV"""
    try:
        wave_obj = sa.WaveObject.from_wave_file(file_path)
        play_obj = wave_obj.play()
        play_obj.wait_done()  # Attend la fin de la lecture
        return True
    except Exception as e:
        print(f"Erreur lors de la lecture audio: {e}")
        return False

def list_all_models():
    """Liste tous les modèles disponibles"""
    try:
        all_models = TTS().list_models()
        print("Modèles disponibles:")
        for i, model in enumerate(all_models):
            print(f"{i+1}. {model}")
        return all_models
    except Exception as e:
        print(f"Erreur lors du listage des modèles: {e}")
        return []

# Interface d'utilisation simple
if __name__ == "__main__":
    # Initialiser le modèle
    print("Initialisation du modèle TTS...")
    tts = initialize_tts()
    
    if tts is None:
        print("Impossible de charger un modèle TTS. Vérifiez votre connexion internet et réessayez.")
        sys.exit(1)
    
    # Tester avec une phrase simple
    sample_text = "Bonjour ! Je suis NANA, l'assistant IA de Nana Intelligence. Comment puis-je vous aider aujourd'hui ?"
    
    if len(sys.argv) > 1:
        # Utiliser le texte fourni en argument
        sample_text = " ".join(sys.argv[1:])
    
    # Générer et jouer l'audio
    output_file = speak(sample_text)
    
    print(f"\nVotre fichier audio a été généré: {output_file}")
    print("Vous pouvez maintenant l'intégrer à votre application web.")