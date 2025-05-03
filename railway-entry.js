// Point d'entrée pour Railway
// Ce fichier ne contient que des instructions pour démarrer l'application

console.log('🚀 Démarrage de l\'application NANA sur Railway...');

// Configuration de l'environnement
process.env.NODE_ENV = 'production';

// Affichage des informations système de base
console.log('==== Informations système ====');
console.log(`Node.js: ${process.version}`);
console.log(`Plateforme: ${process.platform} ${process.arch}`);
console.log(`Répertoire: ${process.cwd()}`);
console.log(`PORT: ${process.env.PORT || '(non défini)'}`);
console.log('============================');

// Importer et démarrer le serveur
import('./dist/index.js')
  .then(() => {
    console.log('✅ Application démarrée avec succès');
  })
  .catch(err => {
    console.error('❌ Erreur au démarrage de l\'application:', err);
    process.exit(1);
  });