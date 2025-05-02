FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci

# Copie du reste du code source
COPY . .

# Construction du frontend (client)
RUN npm run build

# Compilation du backend avec notre fichier production-ready
RUN npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outfile=dist/index.js

# Création des répertoires nécessaires
RUN mkdir -p dist/public

# Copie des fichiers statiques du client vers le répertoire public
RUN if [ -d client/dist ]; then cp -r client/dist/* dist/public/; fi

# Création d'un fichier HTML de base pour le répertoire public (utilisé si aucun fichier n'est copié)
RUN echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>NANA API</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{color:#333}.card{background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0}.success{color:green}</style></head><body><h1>NANA API Server</h1><div class="card"><p class="success">✓ Serveur en ligne</p><p>Le serveur API NANA est en ligne.</p><p><a href="/api/health">Vérification de santé</a></p></div></body></html>' > dist/public/index.html

# Exposition du port
EXPOSE 5000

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "dist/index.js"]