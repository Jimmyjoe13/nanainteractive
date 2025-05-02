# NanaInteractive

Une interface d'agent IA interactive avancée (NANA) qui crée une expérience conversationnelle immersive et émotionnellement intelligente.

## Technologies principales

- Frontend React TypeScript
- Hooks personnalisés pour la lecture audio
- API OpenAI pour la synthèse vocale (Text-to-Speech)
- Interface web responsive
- Architecture de composants modulaire
- Reconnaissance avancée des émotions et du contexte

## Déploiement sur Railway

### Prérequis

- Un compte [Railway](https://railway.app/)
- La CLI Railway installée (optionnel)
- Clé API OpenAI

### Variables d'environnement nécessaires

- `NODE_ENV` : production
- `OPENAI_API_KEY` : votre clé API OpenAI
- `DATABASE_URL` : fournie automatiquement par Railway si vous provisionnez une base de données PostgreSQL

### Instructions de déploiement

1. Connectez votre dépôt GitHub à Railway
2. Créez un nouveau projet Railway à partir du dépôt
3. Provisionnez une base de données PostgreSQL dans votre projet Railway
4. Ajoutez la variable d'environnement `OPENAI_API_KEY` dans les paramètres du projet
5. Déployez l'application

Railway utilisera automatiquement les commandes définies dans le fichier `package.json`:
- `npm run build` pour construire l'application
- `npm run start` pour démarrer le serveur

### Vérification du déploiement

Une fois déployée, l'application sera accessible via l'URL fournie par Railway. Le serveur écoute sur le port défini par Railway (généralement transmis via la variable d'environnement `PORT`).