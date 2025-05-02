FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci

# Copie du reste du code source
COPY . .

# Compilation du projet
RUN npm run build

# Création des répertoires nécessaires
RUN mkdir -p dist/public

# Copie des fichiers statiques
RUN if [ -d client/dist ]; then cp -r client/dist/* dist/public/; fi

# Création d'un fichier HTML de base pour le répertoire public
RUN echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>NANA API</title></head><body><h1>NANA API Server</h1><p>Status: Running</p><p><a href="/api/health">Health Check</a></p></body></html>' > dist/public/index.html

# Exposition du port
EXPOSE 5000

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "dist/index.js"]