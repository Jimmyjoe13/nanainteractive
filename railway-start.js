#!/usr/bin/env node

/**
 * Script de démarrage pour Railway
 * Exécute l'application en production après avoir appliqué les adaptations nécessaires
 */

const { execSync } = require('child_process');
const path = require('path');

// Rendre le script d'adaptation exécutable
try {
  execSync('chmod +x ./railway-build.js');
  console.log('✅ Made adaptation script executable');
} catch (error) {
  console.warn('⚠️ Could not make adaptation script executable:', error.message);
}

// Exécuter le script d'adaptation
console.log('🔧 Running build adaptation for Railway...');
try {
  execSync('node ./railway-build.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build adaptation failed:', error.message);
  process.exit(1);
}

// Démarrer l'application
console.log('🚀 Starting application...');
try {
  execSync('NODE_ENV=production node dist/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Application crashed:', error.message);
  process.exit(1);
}