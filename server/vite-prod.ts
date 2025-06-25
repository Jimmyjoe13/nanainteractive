/**
 * Version adaptée de vite.ts pour l'environnement de production
 * Cette version utilise les utilitaires de setup.ts pour éviter les problèmes avec import.meta.dirname
 */

import express, { type Express } from "express";
import { Server } from "http";
import { getAbsolutePath } from "./setup";
import path from "path";

// Fonction de journalisation avec une source
export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} [${source}] ${message}`);
}

// Utilisation de publicDir issu de setup.ts pour éviter les problèmes avec import.meta.dirname
export function serveStatic(app: Express) {
  const publicDir = getAbsolutePath("dist", "public");
  
  log(`serving static files from ${publicDir}`);
  
  // Servir les fichiers statiques (JS, CSS, images, etc.) avec une politique de cache agressive
  // car ils ont des noms de fichiers uniques (cache-busting).
  app.use(express.static(publicDir, {
    immutable: true,
    maxAge: "1y"
  }));
  
  // Toutes les routes non-API servent le fichier index.html, qui ne doit JAMAIS être mis en cache.
  app.get("*", (req, res, next) => {
    // Ignorer les requêtes API
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    // Servir le fichier index.html pour toutes les autres routes
    const indexPath = path.join(publicDir, "index.html");
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexPath);
  });
}

// Fonction de stub pour éviter d'avoir à modifier index-prod.ts
// Cette fonction ne fait rien en production car Vite n'est pas utilisé
export async function setupVite(_app: Express, _server: Server) {
  log("Vite setup skipped in production mode", "express");
  return;
}
