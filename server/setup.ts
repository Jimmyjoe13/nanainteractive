/**
 * Configuration pour le déploiement sur Railway
 * Ce fichier résout les problèmes liés à import.meta.dirname
 */

import path from 'path';
import fs from 'fs';

// Fonction pour obtenir le chemin absolu basé sur le répertoire courant
// Cette fonction remplace import.meta.dirname qui cause des problèmes en production
export function getAbsolutePath(...paths: string[]): string {
  return path.resolve(process.cwd(), ...paths);
}

// Fonction pour vérifier et créer le répertoire public si nécessaire
export function ensurePublicDirectory(): void {
  const publicDir = getAbsolutePath('dist', 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.log(`Creating public directory at ${publicDir}`);
    fs.mkdirSync(publicDir, { recursive: true });
    
    // Créer un fichier index.html de base si nécessaire
    const indexPath = path.join(publicDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      const basicHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NanaInteractive API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #333; }
    .card { background-color: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>NanaInteractive API</h1>
  <div class="card">
    <p class="success">✓ Server is running</p>
    <p>The API server is running successfully.</p>
    <p>Health check endpoint: <a href="/api/health">/api/health</a></p>
  </div>
</body>
</html>
      `;
      
      fs.writeFileSync(indexPath, basicHtml, 'utf8');
    }
  }
}

// Fonction pour journaliser les informations système au démarrage
export function logSystemInfo(): void {
  console.log('===== SYSTEM INFORMATION =====');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Current directory: ${process.cwd()}`);
  console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`PORT: ${process.env.PORT || '5000 (default)'}`);
  console.log('==============================');
}