FROM node:20-alpine as builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances pour le build
RUN npm ci

# Copie du reste du code source
COPY . .

# Construction du frontend (client)
RUN npm run build

# Compilation du backend avec notre fichier production-ready
RUN npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outfile=dist/index.js

# Exécution des scripts de post-build pour corriger les problèmes potentiels
RUN node railway-postbuild.js
# Nous nous assurons que le fichier est en mode ESM pour respecter type: module dans package.json

# Deuxième étape pour une image plus légère
FROM node:20-alpine

WORKDIR /app

# Copie uniquement des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Installation des dépendances de production uniquement (pas devDependencies)
RUN npm ci --omit=dev

# Copie des scripts nécessaires au démarrage
COPY --from=builder /app/railway-start.js ./

# Création du fichier HTML par défaut (utilisé si aucun fichier n'est dans public/)
RUN echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>NANA API</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{color:#333}.card{background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0}.success{color:green}</style></head><body><h1>NANA API Server</h1><div class="card"><p class="success">✓ Serveur en ligne</p><p>Le serveur API NANA est en ligne.</p><p><a href="/api/health">Vérification de santé</a></p></div></body></html>' > dist/public/index.html

# Exposition du port
EXPOSE 5000

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "dist/index.js"]