#!/usr/bin/env node

/**
 * Script de démarrage pour Railway
 * Exécute l'application en production après avoir appliqué les adaptations nécessaires
 */

console.log('🚀 Démarrage de l\'application NANA sur Railway...');

// Définir NODE_ENV
process.env.NODE_ENV = 'production';

// Définir le port d'écoute (utiliser celui fourni par Railway ou 5000 par défaut)
if (!process.env.PORT) {
  console.log('⚠️ Variable PORT non définie, utilisation du port 5000 par défaut');
  process.env.PORT = '5000';
}

// Vérifier les variables d'environnement essentielles
const requiredVars = ['DATABASE_URL'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('Assurez-vous de configurer ces variables dans votre projet Railway');
  process.exit(1);
}

// Journaliser les informations système
console.log('==== Informations système ====');
console.log(`Node.js: ${process.version}`);
console.log(`OS: ${process.platform} ${process.arch}`);
console.log(`Répertoire: ${process.cwd()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log('============================');

// Démarrer l'application
require('../dist/index.js');