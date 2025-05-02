#!/usr/bin/env node

/**
 * Script pour adapter les fichiers de build pour le déploiement sur Railway
 * Ce script doit être exécuté après le build et avant de démarrer l'application en production
 */

const fs = require('fs');
const path = require('path');

// Fonction pour remplacer import.meta.dirname par une alternative qui fonctionnera en production
function fixImportMetaDirname() {
  // Trouver tous les fichiers JS dans le répertoire dist
  const distDir = path.join(process.cwd(), 'dist');
  const files = findJsFiles(distDir);
  
  console.log(`Found ${files.length} JS files to check for import.meta.dirname references`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Vérifier si le fichier contient des références à import.meta.dirname
      if (content.includes('import.meta.dirname')) {
        console.log(`Modifying ${file} to fix import.meta.dirname references...`);
        
        // Remplacer les références à import.meta.dirname par process.cwd()
        const updatedContent = content.replace(/import\.meta\.dirname/g, 'process.cwd()');
        
        fs.writeFileSync(file, updatedContent, 'utf8');
        fixedCount++;
      }
    } catch (error) {
      console.warn(`⚠️ Error processing file ${file}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully fixed import.meta.dirname references in ${fixedCount} files`);
}

// Fonction pour trouver récursivement tous les fichiers JS dans un répertoire
function findJsFiles(dir) {
  const files = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Récursion pour les sous-répertoires
      files.push(...findJsFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.js')) {
      // Ajouter les fichiers JS
      files.push(fullPath);
    }
  }
  
  return files;
}

// Vérifier et créer les répertoires nécessaires
function ensureDirectories() {
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.log(`Creating public directory at ${publicDir}...`);
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created public directory');
  }
  
  // Copier les fichiers client/dist vers dist/public pour servir les fichiers statiques
  copyClientDistToPublic();
}

// Copier les fichiers du build client vers le répertoire public pour la production
function copyClientDistToPublic() {
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  
  if (fs.existsSync(clientDistDir)) {
    console.log(`Copying client build files from ${clientDistDir} to ${publicDir}...`);
    
    // Copier récursivement tous les fichiers
    copyDirectoryRecursive(clientDistDir, publicDir);
    
    console.log('✅ Successfully copied client build files to public directory');
  } else {
    console.warn(`⚠️ Client build directory ${clientDistDir} not found. Make sure the client was built correctly.`);
  }
}

// Fonction utilitaire pour copier un répertoire récursivement
function copyDirectoryRecursive(sourceDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const items = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(sourceDir, item.name);
    const destPath = path.join(destDir, item.name);
    
    if (item.isDirectory()) {
      // Créer le sous-répertoire et copier son contenu
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      // Copier le fichier
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Fonction principale
function main() {
  console.log('📦 Running Railway build adapter...');
  
  try {
    fixImportMetaDirname();
    ensureDirectories();
    
    console.log('🚀 Build adaptation for Railway completed successfully!');
  } catch (error) {
    console.error('❌ Error during build adaptation:', error);
    process.exit(1);
  }
}

main();