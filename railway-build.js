#!/usr/bin/env node

/**
 * Script pour adapter les fichiers de build pour le déploiement sur Railway
 * Ce script doit être exécuté après le build et avant de démarrer l'application en production
 */

import fs from 'fs';
import path from 'path';

/**
 * Corrige les références import.meta.dirname dans les fichiers JS transpilés
 */
function fixImportMetaDirname() {
  console.log('🔧 Correction des références import.meta.dirname...');
  
  // Trouve tous les fichiers JS dans le répertoire dist
  const jsFiles = findJsFiles('dist');
  let fixedFiles = 0;
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Remplace les références import.meta.dirname par __dirname
    if (content.includes('import.meta.dirname') || content.includes('import.meta.url')) {
      const newContent = content
        .replace(/import\.meta\.dirname/g, 'process.cwd()')
        .replace(/new URL\(.*?import\.meta\.url\)/g, "process.cwd()");
      
      fs.writeFileSync(file, newContent);
      fixedFiles++;
      console.log(`✅ Corrigé: ${file}`);
    }
  }
  
  console.log(`🔧 ${fixedFiles} fichiers corrigés`);
}

/**
 * Recherche récursivement tous les fichiers JS dans un répertoire
 */
function findJsFiles(dir) {
  const files = [];
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Assure l'existence des répertoires nécessaires
 */
function ensureDirectories() {
  console.log('📁 Vérification des répertoires...');
  
  const directories = [
    'dist',
    'dist/public'
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Création du répertoire: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Copie les fichiers statiques du client vers le répertoire public
 */
function copyClientDistToPublic() {
  console.log('📋 Copie des fichiers statiques du client...');
  
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  
  if (fs.existsSync(clientDistDir)) {
    copyDirectoryRecursive(clientDistDir, publicDir);
    console.log('✅ Fichiers statiques copiés avec succès');
  } else {
    console.warn('⚠️ Répertoire client/dist non trouvé. Aucun fichier statique n\'a été copié.');
    
    // Création d'un fichier index.html par défaut
    const indexPath = path.join(publicDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log('📝 Création d\'un fichier index.html par défaut');
      
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
}

/**
 * Copie récursivement un répertoire vers une destination
 */
function copyDirectoryRecursive(sourceDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Préparation des fichiers pour le déploiement sur Railway...');
  
  ensureDirectories();
  fixImportMetaDirname();
  copyClientDistToPublic();
  
  console.log('✅ Préparation terminée. L\'application est prête à être démarrée.');
}

// Exécuter le script
main();