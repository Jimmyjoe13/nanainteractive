/**
 * Serveur de proxy pour l'API TTS Coqui
 * Ce serveur agit comme un intermédiaire entre l'application web et le serveur Python de TTS
 */

const express = require('express');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3001;
const TTS_PORT = 5000;
const TTS_URL = `http://localhost:${TTS_PORT}`;
const AUDIO_DIR = path.join(__dirname, 'audio_output');

// Créer le dossier audio_output s'il n'existe pas
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Initialisation du serveur Express
const app = express();
app.use(express.json());
app.use(cors());
app.use('/audio', express.static(AUDIO_DIR));

// Démarrer le serveur Python TTS
let ttsProcess = null;

function startTTSServer() {
  console.log('Démarrage du serveur TTS Python...');
  ttsProcess = spawn('python3', ['tts_server.py']);
  
  ttsProcess.stdout.on('data', (data) => {
    console.log(`[TTS Server] ${data.toString().trim()}`);
  });
  
  ttsProcess.stderr.on('data', (data) => {
    console.error(`[TTS Server Error] ${data.toString().trim()}`);
  });
  
  ttsProcess.on('close', (code) => {
    console.log(`Le serveur TTS s'est arrêté avec le code ${code}`);
    // Redémarrer si le serveur s'arrête de manière inattendue
    if (code !== 0) {
      console.log('Redémarrage du serveur TTS...');
      setTimeout(startTTSServer, 5000);
    }
  });
}

// Fonction d'attente pour le démarrage du serveur TTS
async function waitForTTSServer() {
  let retries = 30; // 30 secondes max d'attente
  while (retries > 0) {
    try {
      const response = await fetch(`${TTS_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Serveur TTS prêt! Modèle: ${data.model}`);
        return true;
      }
    } catch (error) {
      // Attendre et réessayer
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    retries--;
  }
  
  console.error('Impossible de se connecter au serveur TTS après plusieurs tentatives');
  return false;
}

// Route API pour la synthèse vocale
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Texte requis' });
    }
    
    console.log(`Demande de synthèse vocale reçue: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    // Envoyer la requête au serveur TTS Python
    const response = await fetch(`${TTS_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur TTS:', error);
      return res.status(response.status).json({ error: 'Erreur de génération audio' });
    }
    
    // Récupérer le contenu audio
    const buffer = await response.buffer();
    
    // Générer un nom de fichier unique
    const fileName = `speech_${Date.now()}.wav`;
    const filePath = path.join(AUDIO_DIR, fileName);
    
    // Enregistrer le fichier audio
    fs.writeFileSync(filePath, buffer);
    
    // Renvoyer l'URL du fichier audio
    const audioUrl = `/audio/${fileName}`;
    return res.json({
      audioUrl,
      mimeType: 'audio/wav',
      success: true
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération audio:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour la vérification de l'état du serveur
app.get('/api/tts/status', async (req, res) => {
  try {
    const response = await fetch(`${TTS_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    } else {
      return res.status(response.status).json({ status: 'error', message: 'Serveur TTS indisponible' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Serveur TTS non démarré' });
  }
});

// Route pour lister les modèles disponibles
app.get('/api/tts/models', async (req, res) => {
  try {
    const response = await fetch(`${TTS_URL}/models`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    } else {
      return res.status(response.status).json({ error: 'Impossible de récupérer les modèles' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de communication avec le serveur TTS' });
  }
});

// Démarrer le serveur Node
app.listen(PORT, async () => {
  console.log(`Serveur proxy démarré sur le port ${PORT}`);
  
  // Démarrer le serveur TTS Python
  startTTSServer();
  
  // Attendre que le serveur TTS soit prêt
  await waitForTTSServer();
  
  console.log(`API TTS prête sur http://localhost:${PORT}/api/tts`);
});