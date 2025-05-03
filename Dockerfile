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

# Création du répertoire public et copie des fichiers du client
RUN mkdir -p dist/public && \
    cp -r client/dist/* dist/public/ || echo "No client files found"

# Deuxième étape pour une image plus légère
FROM node:20-alpine

WORKDIR /app

# Copie uniquement des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/railway-entry.js ./

# Installation des dépendances de production uniquement (pas devDependencies)
RUN npm ci --omit=dev

# Exposition du port
EXPOSE 5000

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "railway-entry.js"]