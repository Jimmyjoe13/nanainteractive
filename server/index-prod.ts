/**
 * Point d'entrée pour l'environnement de production (Railway)
 * Cette version utilise les utilitaires de setup.ts pour éviter les problèmes avec import.meta.dirname
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite-prod";
import { ensurePublicDirectory, logSystemInfo } from "./setup";

// Journaliser les informations système au démarrage
logSystemInfo();

// S'assurer que le répertoire public existe
ensurePublicDirectory();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Enregistrer les routes
  const server = await registerRoutes(app);

  // Middleware de gestion des erreurs
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // En production, on sert les fichiers statiques
  serveStatic(app);

  // Utiliser le port fourni par l'environnement (Railway) ou 5000 par défaut
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();