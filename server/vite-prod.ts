/**
 * Version adaptée de vite.ts pour l'environnement de production
 * Cette version utilise les utilitaires de setup.ts pour éviter les problèmes avec import.meta.dirname
 */

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { getAbsolutePath } from "./setup";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // Utiliser getAbsolutePath au lieu de import.meta.dirname
  const distPath = getAbsolutePath("dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  log(`Serving static files from ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    log('Request for non-existent path, serving index.html');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Cette fonction n'est pas utilisée en production
export async function setupVite(_app: Express, _server: Server) {
  throw new Error("setupVite should not be called in production");
}