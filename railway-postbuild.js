#!/usr/bin/env node

/**
 * Script post-build pour corriger les problèmes dans le code transpilé
 * Cette solution permet de corriger les erreurs de import.meta.dirname sans modifier les fichiers source
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour parcourir récursivement un répertoire et appliquer une fonction sur chaque fichier
function traverseDirectory(dir, fileCallback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      traverseDirectory(fullPath, fileCallback);
    } else {
      fileCallback(fullPath);
    }
  }
}

// Fonction pour corriger les références à import.meta.dirname
function fixImportMetaDirname(filePath) {
  if (!filePath.endsWith('.js')) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le fichier contient des références problématiques
    if (content.includes('import.meta.dirname') || content.includes('paths[0]')) {
      console.log(`Fixing file: ${filePath}`);
      
      // Remplacer les références à import.meta.dirname par process.cwd()
      let newContent = content.replace(/import\.meta\.dirname/g, 'process.cwd()');
      
      // Corriger les problèmes de paths[0] undefined
      newContent = newContent.replace(
        /path\.resolve\(([^,]+)(?:,\s*\.\.)?/g, 
        'path.resolve(process.cwd()'
      );
      
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Fonction pour créer le répertoire public et y copier les fichiers statiques
function setupPublicDirectory() {
  const distDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(distDir, 'public');
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  
  // Créer le répertoire public s'il n'existe pas
  if (!fs.existsSync(publicDir)) {
    console.log('Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Copier les fichiers statiques si available
  if (fs.existsSync(clientDistDir)) {
    console.log('Copying static files from client/dist to dist/public...');
    try {
      execSync(`cp -R ${clientDistDir}/* ${publicDir}/`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error copying static files:', error);
      
      // Alternative manual copy if cp command fails
      traverseDirectory(clientDistDir, (filePath) => {
        const relativePath = path.relative(clientDistDir, filePath);
        const destPath = path.join(publicDir, relativePath);
        
        // Create directory structure if needed
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copy file
        fs.copyFileSync(filePath, destPath);
      });
    }
  } else {
    console.log('Warning: client/dist directory not found. No static files will be copied.');
    
    // Create a simple index.html as fallback
    const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NanaInteractive API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #333; }
    .card { background-color: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>NanaInteractive API</h1>
  <div class="card">
    <p class="success">✓ Server is running</p>
    <p>The API server is running successfully. This is the API backend.</p>
    <p>Health check endpoint: <a href="/api/health">/api/health</a></p>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf8');
  }
}

// Fonction principale
function main() {
  console.log('Running post-build fixes...');
  
  const distDir = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found. Build may have failed.');
    process.exit(1);
  }
  
  // Parcourir tous les fichiers JS dans le répertoire dist et les corriger
  traverseDirectory(distDir, fixImportMetaDirname);
  
  // Configurer le répertoire public pour les fichiers statiques
  setupPublicDirectory();
  
  console.log('Post-build fixes completed successfully!');
}

main();