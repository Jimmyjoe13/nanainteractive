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
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      traverseDirectory(fullPath, fileCallback);
    } else {
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
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si le fichier contient des références problématiques
  if (content.includes('import.meta.dirname') || content.includes('import.meta.url')) {
    // Remplacer les problèmes connus
    content = content
      .replace(/import\.meta\.dirname/g, 'process.cwd()')
      .replace(/new URL\('\.', import\.meta\.url\)\.pathname/g, 'process.cwd()');
    
    // Écrire le contenu modifié
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${filePath}`);
  }
}

/**
 * Configure le répertoire public pour la distribution
 */
function setupPublicDirectory() {
  // Créer le répertoire public s'il n'existe pas
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log(`📁 Répertoire créé: ${publicDir}`);
  }
  
  // Copier les fichiers statiques du client vers le répertoire public
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  
  if (fs.existsSync(clientDistDir)) {
    traverseDirectory(clientDistDir, (filePath) => {
      const relativePath = path.relative(clientDistDir, filePath);
      const destPath = path.join(publicDir, relativePath);
      
      // Créer le répertoire parent si nécessaire
      const parentDir = path.dirname(destPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      
      // Copier le fichier
      fs.copyFileSync(filePath, destPath);
    });
    
    console.log('📋 Fichiers statiques copiés avec succès');
  } else {
    console.warn('⚠️ Répertoire client/dist non trouvé');
    
    // Créer un fichier index.html par défaut
    const indexPath = path.join(publicDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>NANA API</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
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
      console.log('📝 Fichier index.html par défaut créé');
    }
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔧 Exécution des corrections post-build...');
  
  // Corriger les problèmes dans les fichiers transpilés
  traverseDirectory('dist', fixImportMetaDirname);
  
  // Configurer le répertoire public
  setupPublicDirectory();
  
  console.log('✅ Corrections terminées avec succès.');
}

// Exécuter le script
main();