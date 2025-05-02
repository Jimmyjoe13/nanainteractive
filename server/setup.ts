/**
 * Configuration pour le déploiement sur Railway
 * Ce fichier résout les problèmes liés à import.meta.dirname
 */

import path from 'path';
import fs from 'fs';
import os from 'os';

// Récupérer un chemin absolu basé sur le répertoire du projet
export function getAbsolutePath(...paths: string[]): string {
  // En production, nous utilisons le répertoire courant comme base
  const baseDir = process.cwd();
  return path.join(baseDir, ...paths);
}

// S'assurer que le répertoire public existe
export function ensurePublicDirectory(): void {
  const publicDir = getAbsolutePath('dist', 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.log(`Création du répertoire public: ${publicDir}`);
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Vérifier si le répertoire public contient un fichier index.html
  const indexPath = path.join(publicDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('Création d\'un fichier index.html par défaut');
    
    // Créer un fichier index.html minimal
    const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NANA API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #333; }
    .card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>NANA API Server</h1>
  <div class="card">
    <p class="success">✓ Serveur en ligne</p>
    <p>Le serveur API NANA est en ligne.</p>
    <p><a href="/api/health">Vérification de santé</a></p>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, defaultHtml);
  }
}

// Journaliser les informations système
export function logSystemInfo(): void {
  console.log('==== Informations système ====');
  console.log(`Node.js: ${process.version}`);
  console.log(`Plateforme: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Mémoire totale: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`);
  console.log(`Mémoire libre: ${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`);
  console.log(`CPU: ${os.cpus().length} cores`);
  console.log(`Répertoire de travail: ${process.cwd()}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`PORT: ${process.env.PORT || '(non défini)'}`);
  console.log('============================');
}