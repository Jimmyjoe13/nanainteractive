#!/usr/bin/env node

/**
 * Script de test pour simuler l'environnement de production
 * Ce script compile et exécute l'application comme elle le serait sur Railway
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Fonction pour exécuter une commande et afficher sa sortie
function runCommand(command, options = {}) {
  console.log(`\n> ${command}\n`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`\n❌ Erreur lors de l'exécution de la commande: ${command}\n`);
    return false;
  }
}

// Nettoyer les build précédents
console.log('🧹 Nettoyage des builds précédents...');
if (fs.existsSync('dist')) {
  try {
    execSync('rm -rf dist');
    console.log('✅ Répertoire dist supprimé');
  } catch (error) {
    console.error('⚠️ Impossible de supprimer le répertoire dist:', error.message);
  }
}

// Compiler le frontend
console.log('\n🔨 Compilation du frontend...');
if (!runCommand('npm run build')) {
  process.exit(1);
}

// Compiler notre backend adapté pour la production
console.log('\n🔨 Compilation du backend adapté pour la production...');
if (!runCommand('npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outfile=dist/index.js')) {
  process.exit(1);
}

// Créer le répertoire public pour les fichiers statiques
console.log('\n📁 Création du répertoire public...');
const publicDir = path.join(process.cwd(), 'dist', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Répertoire public créé');
}

// Copier les fichiers statiques du client
console.log('\n📋 Copie des fichiers statiques...');
const clientDistDir = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistDir)) {
  try {
    execSync(`cp -r ${clientDistDir}/* ${publicDir}/`);
    console.log('✅ Fichiers statiques copiés');
  } catch (error) {
    console.error('⚠️ Erreur lors de la copie des fichiers statiques:', error.message);
  }
}

// Démarrer l'application en mode production
console.log('\n🚀 Démarrage de l\'application en mode production...');
console.log('Pour arrêter l\'application, appuyez sur Ctrl+C\n');

process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

runCommand('node dist/index.js');