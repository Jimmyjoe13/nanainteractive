#!/usr/bin/env node

/**
 * Script de démarrage pour Railway
 * Exécute l'application en production après avoir appliqué les adaptations nécessaires
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration de l'environnement
process.env.NODE_ENV = 'production';

console.log('🚀 Démarrage de l\'application NANA sur Railway...');

// Affichage des informations système de base
console.log('==== Informations système ====');
console.log(`Node.js: ${process.version}`);
console.log(`Plateforme: ${process.platform} ${process.arch}`);
console.log(`Répertoire: ${process.cwd()}`);
console.log(`PORT: ${process.env.PORT || '(non défini)'}`);
console.log('============================');

// Vérification des fichiers nécessaires
const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');

if (!fs.existsSync(distIndexPath)) {
  console.error(`❌ Erreur: Le fichier ${distIndexPath} n'existe pas. L'application ne peut pas démarrer.`);
  console.log('💡 Conseil: Exécutez d\'abord la commande de build pour générer les fichiers nécessaires.');
  process.exit(1);
}

try {
  // Démarrage de l'application
  console.log('🔄 Démarrage du serveur...');
  
  // Importer et démarrer le serveur
  import('./dist/index.js')
    .then(() => {
      console.log('✅ Application démarrée avec succès');
    })
    .catch(err => {
      console.error('❌ Erreur au démarrage de l\'application:', err);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Erreur fatale au démarrage:', error);
  process.exit(1);
}