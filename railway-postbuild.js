#!/usr/bin/env node

/**
 * Script post-build pour corriger les problèmes dans le code transpilé
 * Cette solution permet de corriger les erreurs de import.meta.dirname sans modifier les fichiers source
 */

import fs from 'fs';
import path from 'path';

/**
 * Parcourt un répertoire récursivement et applique une fonction à chaque fichier
 */
function traverseDirectory(dir, fileCallback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      traverseDirectory(fullPath, fileCallback);
    } else if (entry.isFile()) {
      fileCallback(fullPath);
    }
  }
}

/**
 * Corrige les problèmes liés à import.meta.dirname dans le code transpilé
 */
function fixImportMetaDirname(filePath) {
  if (!filePath.endsWith('.js')) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le fichier utilise import.meta.url ou import.meta.dirname
    if (content.includes('import.meta.url') || content.includes('import.meta.dirname')) {
      console.log(`Correction du fichier: ${filePath}`);
      
      // Remplacer import.meta.url par un process.cwd() équivalent
      // et import.meta.dirname par process.cwd()
      const newContent = content
        .replace(/new URL\(['"](.*?)['"]\s*,\s*import\.meta\.url\)/g, "path.join(process.cwd(), '$1')")
        .replace(/import\.meta\.dirname/g, 'process.cwd()');
      
      fs.writeFileSync(filePath, newContent);
    }
  } catch (error) {
    console.error(`Erreur lors de la correction du fichier ${filePath}:`, error);
  }
}

/**
 * Configure le répertoire public pour la distribution
 */
function setupPublicDirectory() {
  const distDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(distDir, 'public');
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  
  // S'assurer que le répertoire public existe
  if (!fs.existsSync(publicDir)) {
    console.log(`Création du répertoire public: ${publicDir}`);
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Copier les fichiers du répertoire client/dist vers dist/public s'il existe
  if (fs.existsSync(clientDistDir)) {
    console.log(`Copie des fichiers statiques de ${clientDistDir} vers ${publicDir}`);
    
    // Copier récursivement
    traverseDirectory(clientDistDir, (srcFile) => {
      const relativePath = path.relative(clientDistDir, srcFile);
      const destFile = path.join(publicDir, relativePath);
      const destDir = path.dirname(destFile);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(srcFile, destFile);
    });
  } else {
    console.warn('Répertoire client/dist non trouvé. Création d\'un fichier index.html par défaut');
    
    // Créer un fichier index.html par défaut
    const indexPath = path.join(publicDir, 'index.html');
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
    <p>Le serveur API NANA est en ligne et fonctionne correctement.</p>
    <p><a href="/api/health">Vérification de santé</a></p>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, defaultHtml);
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔧 Exécution du script post-build...');
  
  // Corriger les problèmes dans les fichiers JavaScript transpilés
  console.log('Correction des problèmes liés à import.meta.dirname dans les fichiers transpilés...');
  traverseDirectory(path.join(process.cwd(), 'dist'), fixImportMetaDirname);
  
  // Configurer le répertoire public
  console.log('Configuration du répertoire public...');
  setupPublicDirectory();
  
  console.log('✅ Script post-build terminé avec succès');
}

// Exécuter le script principal
main();